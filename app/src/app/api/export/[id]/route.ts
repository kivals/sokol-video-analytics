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
  const n = id.replace(/^camera-/, "");
  return NextResponse.json(scenario, {
    headers: {
      "Content-Disposition": `attachment; filename="camera-${n}-annotation.json"`,
    },
  });
}
