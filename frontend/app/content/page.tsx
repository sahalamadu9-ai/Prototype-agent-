'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import ContentGenerator, { type GeneratedContent } from '@/components/ContentGenerator';

type Workspace = { id: string; name: string };

type ContentItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  platform: string | null;
  content: string;
  createdAt: string;
};

type ProviderStatus = {
  name: string;
  model: string;
  ready: boolean;
  demo: boolean;
  configured: boolean;
  hint?: string;
};

export default function ContentPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [error, setError] = useState('');

  const loadItems = useCallback(async (wsId: string) => {
    try {
      const data = await apiFetch<ContentItem[]>(`/content?workspaceId=${wsId}`);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const ws = await apiFetch<Workspace[]>('/workspaces');
        const list = Array.isArray(ws) ? ws : [];
        setWorkspaces(list);
        if (list[0]?.id) setWorkspaceId(list[0].id);
      } catch {
        setError('无法加载工作区，请先登录并在 /workspaces 创建一个工作区。');
      }

      try {
        const provider = await apiFetch<ProviderStatus>('/orchestrator/status');
        setStatus(provider);
      } catch {
        // status is optional for rendering the page
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (workspaceId) void loadItems(workspaceId);
  }, [workspaceId, loadItems]);

  function handleGenerated(_item: GeneratedContent) {
    if (workspaceId) void loadItems(workspaceId);
  }

  const providerLabel = !status
    ? 'LLM 状态未知'
    : status.configured
      ? `真实 OpenAI · ${status.model}`
      : status.demo
        ? 'DEMO 模式（输出会明确标注，不调用真实模型）'
        : 'LLM 未配置';

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand">zapcart <span>agent</span></div>
        <nav className="nav-links">
          <a href="/">Dashboard</a>
          <a href="/content" className="active">Content</a>
          <a href="/projects">Projects</a>
          <a href="/tasks">Tasks</a>
          <a href="/workspaces">Workspaces</a>
        </nav>
      </aside>

      <section className="content page-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">PHASE 2 · CONTENT MODULE</p>
            <h1>内容创作工作台</h1>
            <p className="muted">研究、策略、选题、脚本与社媒文案 — 由 AI Orchestrator 生成并保存为草稿。</p>
          </div>
          <span className={`status-badge ${status?.configured ? 'success' : status?.demo ? 'warning' : 'info'}`}>
            {providerLabel}
          </span>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {status && !status.ready && (
          <div className="error-banner">
            生成接口暂不可用：{status.hint || '请配置 OPENAI_API_KEY 或开启 DEMO_MODE 后重启后端。'}
          </div>
        )}

        <div className="section-blocks">
          <ContentGenerator workspaceId={workspaceId} onGenerated={handleGenerated} />

          <div className="section-card">
            <div className="section-heading">
              <h2>工作区</h2>
              <a href="/workspaces" className="link-btn">管理 →</a>
            </div>

            <div className="field">
              <label htmlFor="workspace">生成到</label>
              <select
                id="workspace"
                value={workspaceId}
                onChange={(e) => { setWorkspaceId(e.target.value); setSelected(null); }}
              >
                <option value="">请选择工作区</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>

            <div className="section-heading" style={{ marginTop: 8 }}>
              <h2>最近草稿 ({items.length})</h2>
            </div>

            <div className="history-list">
              {items.length === 0 ? (
                <div className="mini-card">
                  <small>还没有内容，生成一条试试。</small>
                </div>
              ) : (
                items.map((item) => (
                  <button
                    type="button"
                    className="history-item"
                    key={item.id}
                    onClick={() => setSelected(item)}
                    style={{ textAlign: 'left', width: '100%' }}
                  >
                    <div className="mini-row">
                      <strong>{item.title}</strong>
                      <span className="status-badge">{item.type}</span>
                    </div>
                    <small>{item.platform || 'multi-channel'} · {item.status}</small>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {selected && (
          <div className="section-card full-width">
            <div className="section-heading">
              <h2>{selected.title}</h2>
              <button className="link-btn" type="button" onClick={() => setSelected(null)} style={{ border: 0, background: 'none', cursor: 'pointer' }}>
                关闭
              </button>
            </div>
            <pre className="content-output">{selected.content}</pre>
          </div>
        )}
      </section>
    </main>
  );
}
