# Diabetes Diagnostic AI

An AI-powered clinical tool for early detection and prediction of diabetes risk. This application leverages an Artificial Neural Network (ANN) model trained on the Pima Indians Diabetes Database to provide fast, accurate, and data-driven predictions.

## 🚀 Features

- **AI-Powered Diagnostics**: Utilizes a trained Keras Neural Network to predict diabetes risk based on medical metrics.
- **Modern Dashboard Interface**: Next.js 15 frontend featuring a responsive and intuitive dashboard for clinicians.
- **Robust Backend API**: FastAPI Python backend serving the ML model, equipped with KNN imputation and scaling.
- **Database Integration**: Prisma ORM with MongoDB for secure patient prediction history.
- **PDF Report Generation**: Instantly generate clinical reference reports with a breakdown of feature importance.

## 🛠️ Technology Stack

- **Frontend**: [Next.js](https://nextjs.org/) (React, TypeScript), Tailwind CSS, Lucide Icons.
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), Python, Pandas, Uvicorn.
- **Machine Learning**: TensorFlow / Keras, Scikit-learn (Imputer & Scaler).
- **Database**: MongoDB via Prisma ORM.

## 📂 Project Structure

- `api.py` & `.keras` / `.joblib`: FastAPI backend and the trained Neural Network assets.
- `diabetes-diagnostic/`: Next.js frontend application with dashboard routes and API handlers.
- `diabetes-diagnostic/prisma/`: Prisma schema and database configuration.

## 🚀 Getting Started

### 1. Start the Machine Learning API (Backend)
Ensure you have Python installed, then run:
```bash
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

### 2. Start the Next.js Frontend
In a new terminal, navigate to the frontend folder and set up the environment:
```bash
cd diabetes-diagnostic
npm install
```

Configure your environment variables:
Create a `.env` file in the `diabetes-diagnostic` directory and add your MongoDB connection string:
```
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority"
NEXTAUTH_SECRET="your-super-secret-key-12345"
NEXTAUTH_URL="http://localhost:3000"
```

Initialize the database and start the server:
```bash
npx prisma generate
npx prisma db push
npm run dev
```

Visit `http://localhost:3000` in your browser.

