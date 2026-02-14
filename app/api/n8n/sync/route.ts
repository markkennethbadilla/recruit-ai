import { NextRequest, NextResponse } from "next/server";
import { syncCandidate } from "@/lib/n8n";
import { pushToAirTable } from "@/lib/airtable";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Fire n8n webhook (non-blocking)
    const n8nPromise = syncCandidate({
      candidateName: body.candidateName || body.name || "Unknown",
      candidateEmail: body.candidateEmail || body.email || "",
      parsedResume: body.parsedResume || {},
      scoring: body.scoring || {},
      questions: body.questions || [],
      jobTitle: body.jobTitle || "Not specified",
      candidateId: body.candidateId,
    }).catch(() => ({ success: false, error: "n8n unreachable" }));

    // Push to NocoDB
    const airtablePromise = pushToAirTable({
      name: body.name || body.candidateName || "Unknown",
      email: body.email || body.candidateEmail || "",
      phone: body.phone || "",
      score: body.score || 0,
      recommendation: body.recommendation || "Consider",
      skills: body.skills || [],
      jobTitle: body.jobTitle || "",
      model: body.model || "",
      processedAt: body.processedAt || new Date().toISOString(),
    }).catch(() => ({ success: false, error: "NocoDB unreachable" }));

    const [n8nResult, airtableResult] = await Promise.all([n8nPromise, airtablePromise]);

    return NextResponse.json({
      success: true,
      n8n: { connected: n8nResult.success },
      airtable: airtableResult,
      message: airtableResult.success
        ? `Synced to NocoDB (record: ${"recordId" in airtableResult ? airtableResult.recordId : "n/a"})`
        : `NocoDB: ${airtableResult.error || "failed"}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
