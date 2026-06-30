from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import tensorflow as tf
from tensorflow import keras
import joblib
import pandas as pd
import numpy as np

# Initialize FastAPI App
app = FastAPI(
    title="Diabetes Prediction API",
    description="API to predict diabetes onset using a trained Keras ANN model.",
    version="1.0"
)

# Enable CORS so your Next.js app can make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the saved assets (model, scaler, and imputer)
try:
    model = keras.models.load_model("diabetes_ann_model.keras")
    scaler = joblib.load("scaler.joblib")
    imputer = joblib.load("imputer.joblib")
    print("✅ Model, Scaler, and KNN Imputer loaded successfully.")
except Exception as e:
    print(f"⚠️ Error loading model/scaler/imputer: {e}")
    print("Make sure 'diabetes_ann_model.keras', 'scaler.joblib', and 'imputer.joblib' are in the same folder.")

# Define the input schema for validation
class PatientData(BaseModel):
    pregnancies: int = Field(..., ge=0, description="Number of pregnancies")
    glucose: float = Field(..., ge=0, description="Plasma glucose concentration")
    blood_pressure: float = Field(..., ge=0, description="Diastolic blood pressure (mm Hg)")
    skin_thickness: float = Field(..., ge=0, description="Triceps skin fold thickness (mm)")
    insulin: float = Field(..., ge=0, description="2-Hour serum insulin (mu U/ml)")
    bmi: float = Field(..., ge=0.0, description="Body mass index")
    diabetes_pedigree: float = Field(..., gt=0.0, description="Diabetes pedigree function score")
    age: int = Field(..., gt=0, description="Age in years")

@app.get("/")
def home():
    return {"status": "healthy", "message": "Diabetes Prediction API is running!"}

@app.post("/predict")
def predict_diabetes(data: PatientData):
    try:
        # Convert input to DataFrame (matching original column names/order)
        input_df = pd.DataFrame([{
            "Pregnancies": data.pregnancies,
            "Glucose": data.glucose,
            "BloodPressure": data.blood_pressure,
            "SkinThickness": data.skin_thickness,
            "Insulin": data.insulin,
            "BMI": data.bmi,
            "DiabetesPedigreeFunction": data.diabetes_pedigree,
            "Age": data.age
        }])
        
        # 1. Replace 0s with NaN for biologically impossible values
        zero_cols = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
        input_df_nan = input_df.copy()
        input_df_nan[zero_cols] = input_df_nan[zero_cols].replace(0, np.nan)
        
        # 2. Impute missing values using KNN
        input_df_imputed = pd.DataFrame(imputer.transform(input_df_nan), columns=input_df.columns)
        
        # 3. Apply the exact same Feature Engineering used in training
        input_df_imputed["Glucose_BMI"] = input_df_imputed["Glucose"] * input_df_imputed["BMI"]
        input_df_imputed["Age_Pregnancies"] = input_df_imputed["Age"] * input_df_imputed["Pregnancies"]
        input_df_imputed["Insulin_Glucose_Ratio"] = input_df_imputed["Insulin"] / (input_df_imputed["Glucose"] + 1e-5)
        
        # 4. Scale features using the loaded scaler
        scaled_features = scaler.transform(input_df_imputed)
        
        # 5. Run prediction
        prediction_prob = float(model.predict(scaled_features)[0][0])
        prediction_class = 1 if prediction_prob >= 0.5 else 0
        
        return {
            "prediction": prediction_class,
            "probability": round(prediction_prob, 4),
            "status": "🔴 Diabetes" if prediction_class == 1 else "🟢 No Diabetes"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
