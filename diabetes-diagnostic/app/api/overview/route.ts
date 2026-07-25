import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalPredictions, highRiskCount, lowRiskCount, avgConfidenceResult] = await Promise.all([
      prisma.prediction.count({ where: { userId } }),
      prisma.prediction.count({ where: { userId, predictionResult: 1 } }),
      prisma.prediction.count({ where: { userId, predictionResult: 0 } }),
      prisma.prediction.aggregate({
        where: { userId },
        _avg: { confidenceScore: true },
      }),
    ]);

    const recentActivity = await prisma.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentPredictions = await prisma.prediction.findMany({
      where: {
        userId,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        predictionResult: true,
        createdAt: true,
      },
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const trendMap = new Map<string, { total: number; highRisk: number; order: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      trendMap.set(key, { total: 0, highRisk: 0, order: 5 - i });
    }

    recentPredictions.forEach((p) => {
      const date = new Date(p.createdAt);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (trendMap.has(key)) {
        const bucket = trendMap.get(key)!;
        bucket.total += 1;
        if (p.predictionResult === 1) {
          bucket.highRisk += 1;
        }
      }
    });

    const trendData = Array.from(trendMap.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([key, data]) => ({
        month: key.split(" ")[0],
        total: data.total,
        highRisk: data.highRisk,
      }));

    return NextResponse.json({
      summary: {
        totalPredictions,
        highRiskCount,
        lowRiskCount,
        avgConfidence: avgConfidenceResult._avg.confidenceScore || 0,
      },
      recentActivity,
      trendData,
    });

  } catch (error) {
    console.error("Overview API error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
