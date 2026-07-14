export type Severity = "normal" | "warning" | "violation";

export interface ActionClass {
  id: string;
  name: string;
  color: string;
  severity: Severity;
  description?: string;
}

export interface Camera {
  id: string;          // "camera-1"
  name: string;        // "Камера 1 — Токарный участок"
  area: string;        // "Цех №2"
  video: string;       // "/videos/camera-1.mp4"
}

export interface Zone { x: number; y: number; w: number; h: number }

export interface Segment {
  start: number;       // seconds
  end: number;
  classId: string;
  confidence: number;  // 0..1 base value
}

export interface PointEvent {
  time: number;
  type: "violation" | "warning" | "info";
  title: string;
}

export interface Scenario {
  cameraId: string;
  video: string;
  zone: Zone;
  segments: Segment[];
  events?: PointEvent[];
}

export interface TrainRun {
  id: string;
  startedAt: string;   // ISO
  epochs: number;
  finalLoss: number;
  finalAccuracy: number;
}

export interface ModelInfo {
  id: string;          // "worker-detector" | "hands-detector" | "action-classifier"
  name: string;
  version: string;     // "2.4.1"
  metrics: { accuracy: number; latencyMs: number; f1: number };
  history: TrainRun[];
}
