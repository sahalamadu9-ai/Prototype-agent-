'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

type TaskComposerProps = {
  workspaceId: string;
};

export default function TaskComposer({ workspaceId }: TaskComposerProps) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [task, setTask] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await apiFetch('/orchestrator/process', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId,
          instruction,
          context: { source: 'frontend' },
          requiresApproval: false,
        }),
      });

      setTask(result);
      setInstruction('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="section-card">
      <div className="section-heading">
        <h2>Run AI orchestration</h2>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Example: Create a launch caption set for our beauty campaign."
          rows={5}
          style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd' }}
          required
        />

        {error ? <small style={{ color: '#b91c1c' }}>{error}</small> : null}

        {task ? (
          <div className="mini-card">
            <strong>Task created</strong>
            <div style={{ marginTop: 8 }}>
              <small>Task ID: {task.taskId}</small>
              <br />
              <small>Status: {task.status}</small>
            </div>
          </div>
        ) : null}

        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Running...' : 'Run orchestration'}
        </button>
      </div>
    </form>
  );
}
