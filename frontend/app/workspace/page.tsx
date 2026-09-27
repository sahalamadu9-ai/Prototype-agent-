'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Workspace = {
  id: string;
  name: string;
  description?: string;
  slug?: string;
};

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Workspace[]>('/workspaces');
        setWorkspaces(data || []);
      } catch (error) {
        console.error('Failed to load workspaces:', error);
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
          <p className="eyebrow">WORKSPACES</p>
          <h1>Manage client workspaces</h1>
        </div>
        <button className="primary">New workspace</button>
      </header>

      {loading ? (
        <div className="section-card">Loading workspaces...</div>
      ) : (
        <div className="card-grid">
          {workspaces.map((workspace) => (
            <article key={workspace.id} className="section-card">
              <div className="section-heading">
                <h2>{workspace.name}</h2>
                <span className="status-badge">Active</span>
              </div>
              <p className="muted">{workspace.description || 'No description yet.'}</p>
              <div className="mini-row">
                <small>{workspace.slug || 'workspace'}</small>
                <a href={`/projects?workspaceId=${workspace.id}`} className="link-btn">
                  Open →
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
