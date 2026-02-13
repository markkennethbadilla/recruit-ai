import { NextResponse } from "next/server";
import { getN8nStatus } from "@/lib/n8n";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getN8nStatus();
    return NextResponse.json(status);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to check n8n status";
    return NextResponse.json({ connected: false, workflows: [], error: message }, { status: 500 });
  }
}
