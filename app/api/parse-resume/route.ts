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
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.name.endsWith(".pdf")) {
      // Import the core parser directly to avoid pdf-parse's test file auto-load
      // pdf-parse/index.js tries to read ./test/data/05-versions-space.pdf in debug mode
      // which fails on serverless (Vercel). Importing lib/pdf-parse.js directly bypasses this.
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const data = await pdfParse(buffer);
      text = data.text;
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
  "email": "email@example.com",
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

If a field is not found in the resume, use empty string or empty array. Extract as much detail as possible.`;

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
