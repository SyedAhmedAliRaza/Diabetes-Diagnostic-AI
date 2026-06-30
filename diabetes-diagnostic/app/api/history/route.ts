import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(req.url).searchParams;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search") ?? "";
    const sortField = searchParams.get("sortField") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    const skip = (page - 1) * limit;

    const where = {
      userId: (session?.user as any)?.id,
      ...(search
        ? {
            OR: [
              { patientIdentifier: { contains: search } },
            ],
          }
        : {}),
    };

    const allowedSortFields = ["createdAt", "confidenceScore"];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : "createdAt";
    const validSortOrder = sortOrder === "asc" ? "asc" : "desc";

    const [predictions, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        orderBy: { [validSortField]: validSortOrder },
        skip,
        take: limit,
      }),
      prisma.prediction.count({ where }),
    ]);

    return NextResponse.json({
      predictions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("History route error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
