import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { runScan } from "@/lib/server/scan";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { scenario?: unknown };
    const scenario = typeof body.scenario === "string" && body.scenario.trim() ? body.scenario : undefined;
    const report = await runScan(scenario);
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
