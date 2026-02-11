import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const { parsedResume, jobDescription, model } = await request.json();

    if (!parsedResume || !jobDescription) {
      return NextResponse.json(
        { error: "Missing parsedResume or jobDescription" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert recruiting analyst. Score a candidate's resume against a job description. Return ONLY valid JSON with no markdown formatting, no code blocks, no extra text.

The JSON must follow this exact schema:
{
  "overallScore": 85,
  "breakdown": [
    {
      "category": "Technical Skills Match",
      "score": 8,
      "maxScore": 10,
      "reasoning": "Brief explanation"
    },
    {
      "category": "Experience Level",
      "score": 7,
      "maxScore": 10,
      "reasoning": "Brief explanation"
    },
    {
      "category": "AI/LLM Expertise",
      "score": 9,
      "maxScore": 10,
      "reasoning": "Brief explanation"
    },
    {
      "category": "Automation & Workflow",
      "score": 8,
      "maxScore": 10,
      "reasoning": "Brief explanation"
    },
    {
      "category": "Communication & Documentation",
      "score": 7,
      "maxScore": 10,
      "reasoning": "Brief explanation"
    },
    {
      "category": "Cultural Fit Indicators",
      "score": 8,
      "maxScore": 10,
      "reasoning": "Brief explanation"
    }
  ],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"],
  "recommendation": "strong_match",
  "summary": "2-3 sentence overall assessment"
}

overallScore is 0-100. Each category score is 0-10. recommendation must be one of: strong_match, potential_match, weak_match.
Be thorough and fair in your assessment. Consider both explicit matches and transferable skills.`;

    const result = await callOpenRouter(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Score this candidate:\n\nRESUME DATA:\n${JSON.stringify(parsedResume, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}`,
        },
      ],
      model || "google/gemini-2.0-flash-001"
    );

    let cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const scoring = JSON.parse(cleaned);

    return NextResponse.json({ scoring });
  } catch (error: unknown) {
    console.error("Scoring error:", error);
    const message = error instanceof Error ? error.message : "Failed to score candidate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
