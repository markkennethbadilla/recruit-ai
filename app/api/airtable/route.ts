import { NextRequest, NextResponse } from "next/server";
import { pushToAirTable, getAirTableRecords } from "@/lib/airtable";

// POST: Push a candidate record to NocoDB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, score, recommendation, skills, jobTitle, model, processedAt } = body;

    if (!name) {
      return NextResponse.json({ error: "Candidate name is required" }, { status: 400 });
    }

    const result = await pushToAirTable({
      name,
      email: email || "",
      phone: phone || "",
      score: score || 0,
      recommendation: recommendation || "Consider",
      skills: skills || [],
      jobTitle: jobTitle || "",
      model: model || "",
      processedAt: processedAt || new Date().toISOString(),
    });

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

// GET: Retrieve recent candidate records from NocoDB
export async function GET() {
  try {
    const result = await getAirTableRecords(20);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
