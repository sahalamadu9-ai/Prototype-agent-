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

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Content', href: '/content' },
  { label: 'Creative Studio', href: '#' },
  { label: 'Video Maker', href: '#' },
  { label: 'Brand Brain', href: '#' },
  { label: 'Products', href: '#' },
  { label: 'Campaigns', href: '#' },
  { label: 'Calendar', href: '#' },
  { label: 'Publishing', href: '#' },
  { label: 'Analytics', href: '#' },
];

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
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Workspace[]>('/workspaces');
        const list = data || [];
        setWorkspaces(list);

        if (list[0]?.id) {
          try {
            const items = await apiFetch<unknown[]>(`/content?workspaceId=${list[0].id}`);
            setDraftCount(Array.isArray(items) ? items.length : 0);
          } catch {
            setDraftCount(0);
          }
        }
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
          {navItems.map((item, index) => (
            <a className={index === 0 ? 'active' : ''} href={item.href} key={item.label}>
              {item.label}
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
          <a className="primary" href="/content">Open Content Studio →</a>
        </header>

        <div className="stats">
          <div>
            <span>Workspaces</span>
            <strong>{loading ? '...' : workspaces.length}</strong>
          </div>
          <div>
            <span>Draft content</span>
            <strong>{draftCount ?? '—'}</strong>
          </div>
          <div>
            <span>Scheduled posts</span>
            <strong>—</strong>
          </div>
          <div>
            <span>Audience reach</span>
            <strong>—</strong>
          </div>
        </div>

        <div className="section-blocks">
          <div className="section-card wide">
            <div className="section-heading">
              <h2>Workspace modules</h2>
              <a href="/content" className="link-btn">
                Open Content →
              </a>
            </div>

            <div className="grid">
              {fallbackModules.map(([title, description]) => (
                <article key={title}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <a href={title === 'Content' ? '/content' : '#'}>Open module →</a>
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
