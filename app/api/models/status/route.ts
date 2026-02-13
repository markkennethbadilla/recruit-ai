import { NextResponse } from "next/server";
import { getRateLimitedModels } from "@/lib/openrouter";

export async function GET() {
  return NextResponse.json({
    rateLimited: getRateLimitedModels(),
    timestamp: Date.now(),
  });
}
