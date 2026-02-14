import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File;
    const model = (formData.get("model") as string) || "meta-llama/llama-3.3-70b-instruct:free";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Extract text from file
    let text = "";
    let pdfMailtoEmails: string[] = [];
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.name.endsWith(".pdf")) {
      // Import the core parser directly to avoid pdf-parse's test file auto-load
      // pdf-parse/index.js tries to read ./test/data/05-versions-space.pdf in debug mode
      // which fails on serverless (Vercel). Importing lib/pdf-parse.js directly bypasses this.
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const data = await pdfParse(buffer);
      text = data.text;

      // Extract mailto links from raw PDF bytes (PDF stores URI annotations as plain text)
      // This avoids needing pdfjs-dist which has bundler issues on Vercel
      const rawPdfStr = buffer.toString("latin1");
      const mailtoRegex = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;
      let mailtoMatch;
      while ((mailtoMatch = mailtoRegex.exec(rawPdfStr)) !== null) {
        pdfMailtoEmails.push(mailtoMatch[1]);
      }
    } else if (file.name.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else {
      // Try to read as plain text
      text = buffer.toString("utf-8");
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from file. Try a different format." },
        { status: 400 }
      );
    }

    // Parse with LLM
    const systemPrompt = `You are an expert resume parser. Extract structured data from the resume text provided. Return ONLY valid JSON with no markdown formatting, no code blocks, no extra text.

The JSON must follow this exact schema:
{
  "name": "Full Name",
  "email": "actual_email@domain.com or empty string if not found",
  "phone": "phone number or empty string",
  "location": "City, Country or empty string",
  "summary": "2-3 sentence professional summary based on the resume",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Start - End",
      "highlights": ["key achievement 1", "key achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "year": "Year or range"
    }
  ],
  "certifications": ["cert1", "cert2"]
}

If a field is not found in the resume, use empty string or empty array. For the email field, ONLY include actual email addresses containing @. If the resume does not contain an email address, use an empty string — never use the word "Email" as the value. Extract as much detail as possible.`;

    const result = await callOpenRouter(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse this resume:\n\n${text.substring(0, 8000)}` },
      ],
      model
    );

    // Clean the response - remove markdown code blocks if present
    let cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate email: LLMs sometimes return the literal label "Email" or
    // other non-email strings instead of an actual address.
    if (parsed.email && typeof parsed.email === "string") {
      const emailLike = parsed.email.trim();
      if (!emailLike.includes("@") || /^email$/i.test(emailLike)) {
        parsed.email = "";
      }
    }

    // Regex fallback: if LLM didn't extract an email, scan raw text directly
    if (!parsed.email) {
      // Priority 1: mailto links from PDF annotations (most reliable)
      if (pdfMailtoEmails.length > 0) {
        parsed.email = pdfMailtoEmails[0];
      } else {
        // Priority 2: regex scan of raw text
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = text.match(emailRegex);
        if (matches && matches.length > 0) {
          // Filter out common non-personal emails
          const personal = matches.find(
            (e) => !/^(info|support|contact|admin|noreply|no-reply|hello|help)@/i.test(e)
          );
          parsed.email = personal || matches[0];
        }
      }
    }

    return NextResponse.json({
      parsed,
      rawText: text.substring(0, 2000),
    });
  } catch (error: unknown) {
    console.error("Parse error:", error);
    const message = error instanceof Error ? error.message : "Failed to parse resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
