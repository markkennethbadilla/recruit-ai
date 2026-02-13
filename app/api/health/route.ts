import { NextResponse } from "next/server";
import { getHealthStatus } from "@/lib/ai-monitor";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = getHealthStatus();
    return NextResponse.json(health);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Health check failed";
    return NextResponse.json(
      { status: "unhealthy", error: message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
