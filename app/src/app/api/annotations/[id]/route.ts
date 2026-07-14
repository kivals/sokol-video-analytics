import { NextRequest, NextResponse } from "next/server";
import { getScenario } from "@/lib/server/db";
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
  return NextResponse.json(scenario);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await apiDelay();
  await params;
  await req.json().catch(() => null);
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
