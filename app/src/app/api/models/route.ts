import { NextResponse } from "next/server";
import { getModels } from "@/lib/server/db";
import { apiDelay } from "@/lib/server/delay";

export async function GET() {
  await apiDelay();
  return NextResponse.json({ models: getModels() });
}
