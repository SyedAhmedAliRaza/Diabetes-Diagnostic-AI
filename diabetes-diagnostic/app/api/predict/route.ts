import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      pregnancies,
      glucose,
      bloodPressure,
      skinThickness,
      insulin,
      bmi,
      diabetesPedigree,
      age,
      patientIdentifier,
    } = body;

    // Validate required fields
    const required = { pregnancies, glucose, bloodPressure, skinThickness, insulin, bmi, diabetesPedigree, age };
    for (const [key, value] of Object.entries(required)) {
      if (value === undefined || value === null || value === "") {
        return NextResponse.json(
          { error: `Missing required field: ${key}` },
          { status: 400 }
        );
      }
    }

    // Forward to FastAPI backend
    let prediction: number;
    let probability: number;
    let status: string;

    try {
      const fastapiResponse = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pregnancies: Number(pregnancies),
          glucose: Number(glucose),
          blood_pressure: Number(bloodPressure),
          skin_thickness: Number(skinThickness),
          insulin: Number(insulin),
          bmi: Number(bmi),
          diabetes_pedigree: Number(diabetesPedigree),
          age: Number(age),
        }),
      });

      if (!fastapiResponse.ok) {
        throw new Error(`FastAPI returned ${fastapiResponse.status}`);
      }

      const fastapiData = await fastapiResponse.json();
      prediction = fastapiData.prediction;
      probability = fastapiData.probability;
      status = fastapiData.status;
    } catch (fastapiError) {
      console.warn("FastAPI unavailable, using mock prediction:", fastapiError);
      // Mock prediction when FastAPI is not running (for UI testing)
      const glucoseRisk = Number(glucose) > 140 ? 0.3 : 0;
      const bmiRisk = Number(bmi) > 30 ? 0.2 : 0;
      const ageRisk = Number(age) > 45 ? 0.1 : 0;
      const baseRisk = 0.2;
      probability = Math.min(baseRisk + glucoseRisk + bmiRisk + ageRisk, 0.95);
      prediction = probability >= 0.5 ? 1 : 0;
      status = prediction === 1 ? "🔴 Diabetes (Mock)" : "🟢 No Diabetes (Mock)";
    }

    // Determine high-risk features for display
    const featureBreakdown = [
      { name: "Glucose", value: Number(glucose), unit: "mg/dL", high: Number(glucose) > 140, optimal: Number(glucose) <= 100 },
      { name: "BMI", value: Number(bmi), unit: "kg/m²", high: Number(bmi) > 30, optimal: Number(bmi) <= 24.9 },
      { name: "Blood Pressure", value: Number(bloodPressure), unit: "mm Hg", high: Number(bloodPressure) > 90, optimal: Number(bloodPressure) <= 80 },
      { name: "Age", value: Number(age), unit: "years", high: Number(age) > 45, optimal: Number(age) < 35 },
      { name: "Insulin", value: Number(insulin), unit: "mu U/ml", high: Number(insulin) > 166, optimal: Number(insulin) <= 166 },
      { name: "Pregnancies", value: Number(pregnancies), unit: "", high: Number(pregnancies) > 6, optimal: Number(pregnancies) <= 3 },
      { name: "Skin Thickness", value: Number(skinThickness), unit: "mm", high: Number(skinThickness) > 35, optimal: Number(skinThickness) <= 20 },
      { name: "Diabetes Pedigree", value: Number(diabetesPedigree), unit: "", high: Number(diabetesPedigree) > 0.8, optimal: Number(diabetesPedigree) <= 0.4 },
    ];

    // Save to database
    const saved = await prisma.prediction.create({
      data: {
        userId: (session?.user as any)?.id,
        patientIdentifier: patientIdentifier || null,
        pregnancies: Number(pregnancies),
        glucose: Number(glucose),
        bloodPressure: Number(bloodPressure),
        skinThickness: Number(skinThickness),
        insulin: Number(insulin),
        bmi: Number(bmi),
        diabetesPedigree: Number(diabetesPedigree),
        age: Number(age),
        predictionResult: prediction,
        confidenceScore: probability,
      },
    });

    return NextResponse.json({
      id: saved.id,
      patientIdentifier: saved.patientIdentifier,
      prediction,
      probability,
      status,
      featureBreakdown,
    });
  } catch (error) {
    console.error("Predict route error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
