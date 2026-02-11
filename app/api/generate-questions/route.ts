import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const { parsedResume, jobDescription, scoringResult, model } = await request.json();

    if (!parsedResume || !jobDescription) {
      return NextResponse.json(
        { error: "Missing parsedResume or jobDescription" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert technical recruiter. Generate tailored screening questions for a candidate based on their resume, the job description, and scoring results. Return ONLY valid JSON with no markdown formatting, no code blocks, no extra text.

The JSON must follow this exact schema:
{
  "questions": [
    {
      "question": "The interview question",
      "purpose": "What this question evaluates",
      "lookFor": "What a strong answer looks like",
      "difficulty": "easy"
    }
  ]
}

Generate exactly 8 questions:
- 2 easy (warm-up, verify resume claims)
- 3 medium (probe depth of experience, problem-solving)
- 3 hard (test expertise, scenario-based, edge cases)

Focus questions on:
1. Gaps identified in the scoring
2. Key skills required by the job description
3. Verifying claimed experience
4. Cultural fit and work style
5. Real-world scenario problem solving

Make questions specific to the candidate's background and the role, not generic.`;

    const userContent = `Generate screening questions for this candidate:

RESUME DATA:
${JSON.stringify(parsedResume, null, 2)}

JOB DESCRIPTION:
${jobDescription}

${scoringResult ? `SCORING RESULTS:\n${JSON.stringify(scoringResult, null, 2)}` : ""}`;

    const result = await callOpenRouter(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      model || "meta-llama/llama-3.3-70b-instruct:free"
    );

    let cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const { questions } = JSON.parse(cleaned);

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    console.error("Question generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
