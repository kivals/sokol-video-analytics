import { NextResponse } from "next/server";
import { getJob, jobProgress } from "@/lib/server/trainJobs";

// Shorter delay than apiDelay(): this endpoint is polled every second,
// so a large artificial latency would make the UI feel laggy.
const pollDelay = () => new Promise((r) => setTimeout(r, 50 + Math.random() * 150));

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  await pollDelay();
  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }
  return NextResponse.json(jobProgress(job));
}
