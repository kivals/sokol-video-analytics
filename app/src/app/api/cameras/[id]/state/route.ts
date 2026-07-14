import { NextRequest, NextResponse } from "next/server";
import { getClasses, getScenario } from "@/lib/server/db";
import { jitter, segmentAt } from "@/lib/scenario";
import { apiDelay } from "@/lib/server/delay";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await apiDelay();
  const { id } = await params;
  const scenario = getScenario(id);
  if (!scenario) {
    return NextResponse.json({ error: "camera not found" }, { status: 404 });
  }
  const t = Number(req.nextUrl.searchParams.get("t") ?? 0);
  const seg = segmentAt(scenario, t);
  return NextResponse.json({
    classId: seg?.classId ?? null,
    confidence: seg ? jitter(seg.confidence) : 0,
    fps: 25,
    latencyMs: Math.round(900 + Math.random() * 700),
  });
}
