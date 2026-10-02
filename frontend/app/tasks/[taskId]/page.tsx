'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import TaskStatusCard from '@/components/TaskStatusCard';

type JobResult = {
  id: string;
  type: string;
  status: string;
  progress: number;
  input?: any;
  output?: any;
  error?: string;
};

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = String(params.taskId || '');

  const [job, setJob] = useState<JobResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;

    async function poll() {
      try {
        const data = await apiFetch<JobResult>(`/orchestrator/${taskId}`);
        setJob(data);
      } catch (error) {
        console.error('Failed to load task:', error);
      } finally {
        setLoading(false);
      }
    }

    poll();

    const interval = setInterval(() => {
      if (!taskId) return;
      void poll();
    }, 3000);

    return () => clearInterval(interval);
  }, [taskId]);

  if (!job && loading) {
    return <main className="content page-shell"><div className="section-card">Loading task...</div></main>;
  }

  if (!job) {
    return <main className="content page-shell"><div className="section-card">Task not found.</div></main>;
  }

  return (
    <main className="content page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">TASK DETAIL</p>
          <h1>{job.type}</h1>
        </div>
      </header>

      <div className="card-grid">
        <TaskStatusCard
          taskId={job.id}
          status={job.status}
          progress={job.progress}
          output={job.output}
        />

        <div className="section-card">
          <div className="section-heading">
            <h2>Input</h2>
          </div>

          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(job.input || {}, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}
