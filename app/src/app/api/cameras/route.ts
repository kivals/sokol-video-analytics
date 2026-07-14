import { NextResponse } from "next/server";
import { getCameras } from "@/lib/server/db";
import { apiDelay } from "@/lib/server/delay";

export async function GET() {
  await apiDelay();
  const cameras = getCameras().map((c) => ({ ...c, status: "online" as const }));
  return NextResponse.json({ cameras });
}
