'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import TaskComposer from '@/components/TaskComposer';

type Task = {
  id: string;
  type: string;
  status: string;
  progress: number;
  createdAt?: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams(window.location.search);
        const wsId = params.get('workspaceId');

        if (!wsId) {
          setLoading(false);
          return;
        }

        setWorkspaceId(wsId);
        const data = await apiFetch<Task[]>(`/projects?workspaceId=${wsId}`);
        setTasks(data || []);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="content page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">TASKS</p>
          <h1>AI orchestration and execution queue</h1>
        </div>
      </header>

      <div className="card-grid">
        {workspaceId && <TaskComposer workspaceId={workspaceId} />}
      </div>

      {loading ? (
        <div className="section-card">Loading tasks...</div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <div key={task.id || task.type} className="task-row">
              <div>
                <strong>{task.type}</strong>
                <small>{task.status}</small>
              </div>
              <span className="time-label">{task.createdAt || 'just now'}</span>
              <span className={task.status === 'completed' ? 'status-badge success' : task.status === 'running' ? 'status-badge warning' : 'status-badge info'}>
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
