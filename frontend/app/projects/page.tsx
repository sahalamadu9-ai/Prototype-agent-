'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import ProjectForm from '@/components/ProjectForm';

type Project = {
  id: string;
  name: string;
  description?: string;
  status?: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState('');

  async function loadProjects() {
    try {
      const params = new URLSearchParams(window.location.search);
      const wsId = params.get('workspaceId');

      if (!wsId) {
        setLoading(false);
        return;
      }

      setWorkspaceId(wsId);
      const data = await apiFetch<Project[]>(`/projects?workspaceId=${wsId}`);
      setProjects(data || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <main className="content page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">PROJECTS</p>
          <h1>Campaign and content projects</h1>
        </div>
      </header>

      <div className="card-grid">
        {workspaceId && <ProjectForm workspaceId={workspaceId} onCreated={loadProjects} />}
      </div>

      {loading ? (
        <div className="section-card">Loading projects...</div>
      ) : (
        <div className="project-list">
          {projects.map((project) => (
            <div key={project.id} className="project-row">
              <div>
                <strong>{project.name}</strong>
                <small>{project.description || 'Project workspace item'}</small>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${project.status === 'draft' ? 30 : 60}%` }} />
              </div>
              <span
                className={
                  project.status === 'draft'
                    ? 'status-badge info'
                    : project.status === 'completed'
                      ? 'status-badge success'
                      : 'status-badge warning'
                }
              >
                {project.status || 'Draft'}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
