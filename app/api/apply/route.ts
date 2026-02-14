import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/apply
 * Receives candidate applications from the /apply page.
 * Stores the submission and optionally triggers the pipeline.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 5 applications per minute per IP
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`apply:${ip}`, 5);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = (formData.get("phone") as string) || "";
    const position = formData.get("position") as string;
    const resume = formData.get("resume") as File | null;
    const coverNote = (formData.get("coverNote") as string) || "";

    if (!name || !email || !position) {
      return NextResponse.json(
        { error: "Name, email, and position are required." },
        { status: 400 }
      );
    }

    if (!resume) {
      return NextResponse.json(
        { error: "Please upload your resume." },
        { status: 400 }
      );
    }

    // Extract resume text
    let resumeText = "";
    const buffer = Buffer.from(await resume.arrayBuffer());

    if (resume.name.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const data = await pdfParse(buffer);
      resumeText = data.text;
    } else {
      resumeText = buffer.toString("utf-8");
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "Could not read your resume. Please try a different format (PDF or TXT)." },
        { status: 400 }
      );
    }

    // Push to NocoDB as a raw application
    const { pushToAirTable } = await import("@/lib/airtable");
    const airtableResult = await pushToAirTable({
      name,
      email,
      phone,
      score: 0, // not scored yet
      recommendation: "Pending Review",
      skills: [],
      jobTitle: position,
      model: "candidate-submitted",
      processedAt: new Date().toISOString(),
    }).catch(() => ({ success: false, error: "NocoDB unavailable" }));

    // Fire n8n webhook for candidate intake (non-blocking)
    const { notifyCandidateProcessed } = await import("@/lib/n8n");
    notifyCandidateProcessed({
      candidateName: name,
      candidateEmail: email,
      parsedResume: { name, email, phone, rawText: resumeText.substring(0, 2000) },
      scoring: {},
      questions: [],
      jobTitle: position,
    }).catch(() => {/* non-blocking */});

    return NextResponse.json({
      success: true,
      message: "Application received! Our team will review your profile shortly.",
      applicationId: airtableResult.success && "recordId" in airtableResult
        ? airtableResult.recordId
        : `APP-${Date.now().toString(36).toUpperCase()}`,
      airtable: airtableResult.success,
    });
  } catch (error: unknown) {
    console.error("Application error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
