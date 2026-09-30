'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Workspace = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  createdAt?: string;
};

const fallbackModules = [
  ['Content', 'Research, ideas, scripts, and captions'],
  ['Creative Studio', 'Write-ups, thumbnails, and scene images'],
  ['Video Maker', 'Create, render, and export videos'],
  ['Brand Brain', 'Keep every asset aligned with your brand'],
  ['Products', 'Manage your digital products'],
  ['Campaigns', 'Plan and coordinate marketing campaigns'],
];

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Workspace[]>('/workspaces');
        setWorkspaces(data || []);
      } catch (error) {
        console.error('Failed to load workspaces:', error);
        setWorkspaces([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          zapcart <span>agent</span>
        </div>

        <nav className="nav-links">
          {['Dashboard', 'Content', 'Creative Studio', 'Video Maker', 'Brand Brain', 'Products', 'Campaigns', 'Calendar', 'Publishing', 'Analytics'].map((item, index) => (
            <a className={index === 0 ? 'active' : ''} href={index === 0 ? '/' : '#'} key={item}>
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <section className="content">
        <header className="header">
          <div>
            <p className="eyebrow">WORKSPACE OVERVIEW</p>
            <h1>Good morning, creator.</h1>
            <p className="muted">Build, manage, and publish your next campaign from one workspace.</p>
          </div>
          <button className="primary">Ask AI Orchestrator</button>
        </header>

        <div className="stats">
          <div>
            <span>Workspaces</span>
            <strong>{loading ? '...' : workspaces.length}</strong>
          </div>
          <div>
            <span>Draft content</span>
            <strong>12</strong>
          </div>
          <div>
            <span>Scheduled posts</span>
            <strong>08</strong>
          </div>
          <div>
            <span>Audience reach</span>
            <strong>24.8K</strong>
          </div>
        </div>

        <div className="section-blocks">
          <div className="section-card wide">
            <div className="section-heading">
              <h2>Workspace modules</h2>
              <a href="/workspaces" className="link-btn">
                View all →
              </a>
            </div>

            <div className="grid">
              {fallbackModules.map(([title, description]) => (
                <article key={title}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <a href="#">Open module →</a>
                </article>
              ))}
            </div>
          </div>

          <div className="section-card">
            <div className="section-heading">
              <h2>Workspaces</h2>
              <a href="/workspaces" className="link-btn">
                Manage →
              </a>
            </div>

            <div className="workspace-list">
              {workspaces.length > 0 ? (
                workspaces.map((workspace) => (
                  <div key={workspace.id || workspace.slug || workspace.name} className="mini-card">
                    <div className="mini-row">
                      <strong>{workspace.name}</strong>
                      <span className="status-badge">Active</span>
                    </div>
                    <small>{workspace.description || 'Workspace'}</small>
                  </div>
                ))
              ) : (
                <div className="mini-card">
                  <div className="mini-row">
                    <strong>No workspace yet</strong>
                  </div>
                  <small>Create one from the workspace page.</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
