import type { ActionClass, Camera, ModelInfo, Scenario } from "@/lib/types";
import classesData from "@/data/classes.json";
import camerasData from "@/data/cameras.json";
import modelsData from "@/data/models.json";
import camera1 from "@/data/scenarios/camera-1.json";
import camera2 from "@/data/scenarios/camera-2.json";
import camera3 from "@/data/scenarios/camera-3.json";
import camera4 from "@/data/scenarios/camera-4.json";
import camera5 from "@/data/scenarios/camera-5.json";
import camera6 from "@/data/scenarios/camera-6.json";

const classes = classesData as ActionClass[];
const cameras = camerasData as Camera[];
const models = modelsData as ModelInfo[];

const scenarios = new Map<string, Scenario>(
  [camera1, camera2, camera3, camera4, camera5, camera6].map((s) => [
    (s as Scenario).cameraId,
    s as Scenario,
  ]),
);

export function getCameras(): Camera[] {
  return cameras;
}

export function getClasses(): ActionClass[] {
  return classes;
}

export function getModels(): ModelInfo[] {
  return models;
}

export function getScenario(id: string): Scenario | null {
  return scenarios.get(id) ?? null;
}

export function getScenarios(): Scenario[] {
  return [...scenarios.values()];
}
