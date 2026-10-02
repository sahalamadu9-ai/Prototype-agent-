import { prisma } from '../db/client.js';
import orchestrator from '../orchestrator/AIOrchestrator.js';

const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS || 2000);
const maxRetries = Number(process.env.WORKER_MAX_RETRIES || 3);
let running = false;

async function claimNextJob() {
  if (running) return;
  running = true;

  try {
    const job = await prisma.job.findFirst({
      where: {
        status: {
          in: ['queued', 'failed'],
        },
        attempts: { lt: maxRetries },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!job) return;

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'processing',
        attempts: { increment: 1 },
        progress: 10,
        error: null,
      },
    });

    try {
      const result = await orchestrator.execute(job.id, true);

      if (result.status === 'failed') {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: job.attempts + 1 >= maxRetries ? 'failed' : 'queued',
            error: result.error || 'Job failed',
            progress: job.attempts + 1 >= maxRetries ? 50 : 25,
          },
        });
        return;
      }

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          output: JSON.stringify(result.result ?? result),
          progress: 100,
          error: null,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const nextAttempts = job.attempts + 1;

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: nextAttempts >= maxRetries ? 'failed' : 'queued',
          attempts: nextAttempts,
          error: errorMessage,
          progress: nextAttempts >= maxRetries ? 50 : 20,
        },
      });
    }
  } finally {
    running = false;
  }
}

export function startJobWorker() {
  const timer = setInterval(() => void claimNextJob(), pollIntervalMs);
  void claimNextJob();
  return () => clearInterval(timer);
}
