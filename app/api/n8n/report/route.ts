import { NextRequest, NextResponse } from "next/server";
import { generatePipelineReport } from "@/lib/n8n";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidates, period } = body;

    if (!candidates || !Array.isArray(candidates)) {
      return NextResponse.json({ error: "Missing candidates array" }, { status: 400 });
    }

    const result = await generatePipelineReport({ candidates, period });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Report generation failed", n8nConnected: false },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, report: result.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Report generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
