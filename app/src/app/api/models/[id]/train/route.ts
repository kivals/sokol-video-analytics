import { NextResponse } from "next/server";
import { getModels } from "@/lib/server/db";
import { apiDelay } from "@/lib/server/delay";
import { startJob } from "@/lib/server/trainJobs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await apiDelay();
  const { id } = await params;
  const model = getModels().find((m) => m.id === id);
  if (!model) {
    return NextResponse.json({ error: "model not found" }, { status: 404 });
  }
  const job = startJob(id);
  return NextResponse.json({ jobId: job.id });
}
