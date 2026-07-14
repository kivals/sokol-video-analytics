interface TrainJob {
  id: string;
  modelId: string;
  startedAt: number;
  durationMs: number;
  epochs: number;
}

interface JobProgress {
  epoch: number;
  totalEpochs: number;
  progress: number;
  loss: number;
  accuracy: number;
  etaSeconds: number;
  done: boolean;
}

const store = ((globalThis as unknown as { __sokolJobs?: Map<string, TrainJob> }).__sokolJobs ??=
  new Map<string, TrainJob>());

export function startJob(modelId: string): TrainJob {
  const job: TrainJob = {
    id: crypto.randomUUID(),
    modelId,
    startedAt: Date.now(),
    durationMs: 90_000,
    epochs: 24,
  };
  store.set(job.id, job);
  return job;
}

export function getJob(id: string): TrainJob | undefined {
  return store.get(id);
}

export function jobProgress(job: TrainJob): JobProgress {
  const elapsed = Date.now() - job.startedAt;
  const p = Math.min(1, Math.max(0, elapsed / job.durationMs));

  const epoch = Math.min(job.epochs, Math.max(1, Math.ceil(p * job.epochs)));

  const lossNoise = (Math.random() * 2 - 1) * 0.03;
  const loss = 1.8 * Math.exp(-4 * p) + 0.06 + lossNoise;

  const accuracyNoise = (Math.random() * 2 - 1) * 0.008;
  const accuracy = Math.min(
    0.989,
    0.55 + 0.424 * (1 - Math.exp(-3.5 * p)) + accuracyNoise,
  );

  const etaSeconds = Math.max(0, (job.durationMs - elapsed) / 1000);
  const done = p >= 1;

  return {
    epoch,
    totalEpochs: job.epochs,
    progress: p,
    loss,
    accuracy,
    etaSeconds,
    done,
  };
}
