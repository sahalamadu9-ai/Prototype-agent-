import { prisma } from '../db/client.js';
import orchestrator from '../orchestrator/AIOrchestrator.js';

const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS || 2000);
let running = false;

async function claimNextJob() {
  if (running) return;
  running = true;
  try {
    const job = await prisma.job.findFirst({ where: { status: 'queued' }, orderBy: { createdAt: 'asc' } });
    if (!job) return;
    await prisma.job.update({ where: { id: job.id }, data: { status: 'running', attempts: { increment: 1 }, progress: 10 } });
    try {
      const result = await orchestrator.execute(job.id, true);
      await prisma.job.update({ where: { id: job.id }, data: { status: result.status === 'failed' ? 'failed' : 'completed', output: JSON.stringify(result.result ?? result), progress: 100 } });
    } catch (error) {
      await prisma.job.update({ where: { id: job.id }, data: { status: 'failed', error: error instanceof Error ? error.message : String(error) } });
    }
  } finally { running = false; }
}

export function startJobWorker() {
  const timer = setInterval(() => void claimNextJob(), pollIntervalMs);
  void claimNextJob();
  return () => clearInterval(timer);
}
