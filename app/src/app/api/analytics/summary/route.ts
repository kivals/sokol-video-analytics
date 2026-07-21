import { NextResponse } from "next/server";
import { getCameras, getClasses, getScenarios } from "@/lib/server/db";
import { countViolations, deriveEvents, timeByClass } from "@/lib/scenario";
import { apiDelay } from "@/lib/server/delay";

export async function GET() {
  await apiDelay();
  const classes = getClasses();
  const cameras = getCameras();
  const scenarios = getScenarios();

  const secondsByClass = new Map<string, number>();
  let totalSeconds = 0;
  for (const scenario of scenarios) {
    for (const ct of timeByClass(scenario)) {
      secondsByClass.set(ct.classId, (secondsByClass.get(ct.classId) ?? 0) + ct.seconds);
      totalSeconds += ct.seconds;
    }
  }
  const timeByClassMerged = [...secondsByClass.entries()].map(([classId, seconds]) => ({
    classId,
    seconds,
    share: totalSeconds ? seconds / totalSeconds : 0,
  }));

  const violationsByCamera = cameras.map((camera) => {
    const scenario = scenarios.find((s) => s.cameraId === camera.id);
    const counts = scenario
      ? countViolations(scenario, classes)
      : { violations: 0, warnings: 0 };
    return { cameraId: camera.id, ...counts };
  });

  const events = scenarios
    .flatMap((scenario) =>
      deriveEvents(scenario, classes).map((e) => ({ ...e, cameraId: scenario.cameraId })),
    )
    .sort((a, b) => a.time - b.time);

  return NextResponse.json({
    accuracy: 0.974,
    latencySeconds: 1.2,
    streams: { active: cameras.length, total: cameras.length },
    framesProcessed: 1_284_503 + (Math.floor(Date.now() / 1000) % 100_000),
    timeByClass: timeByClassMerged,
    violationsByCamera,
    events,
  });
}
