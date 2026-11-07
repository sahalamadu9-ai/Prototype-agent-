'use client';

import { useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api';

export const CONTENT_TYPES = [
  { value: 'research', label: 'Research', hint: '市场 / 受众洞察' },
  { value: 'strategy', label: 'Strategy', hint: '内容策略与支柱' },
  { value: 'ideas', label: 'Ideas', hint: '选题与创意角度' },
  { value: 'scripts', label: 'Scripts', hint: '短视频脚本' },
  { value: 'captions', label: 'Captions', hint: '社媒文案' },
] as const;

export type GeneratedContent = {
  id: string;
  projectId: string;
  type: string;
  title: string;
  content: string;
  status: string;
  platform: string | null;
  provider: string;
  model: string;
  tokensUsed: number;
  demo: boolean;
};

export default function ContentGenerator({
  workspaceId,
  onGenerated,
}: {
  workspaceId: string;
  onGenerated: (item: GeneratedContent) => void;
}) {
  const [type, setType] = useState<string>('ideas');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId) {
      setError('请先在右侧选择一个工作区。');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await apiFetch<GeneratedContent>(`/content/${type}`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId,
          topic,
          platform,
          audience: audience || undefined,
          tone: tone || undefined,
          quantity,
        }),
      });
      setResult(data);
      onGenerated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="section-card" onSubmit={submit}>
      <div className="section-heading">
        <h2>生成内容</h2>
        <span className="status-badge info">Phase 2</span>
      </div>

      <div className="form-grid">
        <div className="field wide">
          <label htmlFor="topic">主题 / 指令</label>
          <textarea
            id="topic"
            required
            minLength={3}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：为面向拉各斯年轻妈妈的保温水瓶新品做一轮选题"
          />
        </div>

        <div className="field">
          <label htmlFor="type">内容类型</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            {CONTENT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label} · {item.hint}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="platform">渠道</label>
          <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {['instagram', 'tiktok', 'youtube', 'email', 'blog', 'multi-channel'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="audience">目标受众（可选）</label>
          <input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="年轻妈妈 / 中小卖家" />
        </div>

        <div className="field">
          <label htmlFor="tone">语气（可选）</label>
          <input id="tone" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="活泼 / 专业 / 俏皮" />
        </div>

        <div className="field">
          <label htmlFor="quantity">数量</label>
          <input
            id="quantity"
            type="number"
            min={1}
            max={20}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
      </div>

      <button className="primary" type="submit" disabled={loading || !topic.trim()}>
        {loading ? '生成中…' : '用 AI 生成 →'}
      </button>

      {error && <div className="error-banner">{error}</div>}

      {result && (
        <div>
          <div className="meta-row">
            <span className={`status-badge ${result.demo ? 'warning' : 'success'}`}>
              {result.demo ? 'DEMO' : result.provider}
            </span>
            <span>model: {result.model}</span>
            <span>tokens: {result.tokensUsed}</span>
            <span>已保存为草稿 #{result.id.slice(0, 8)}</span>
          </div>
          <pre className="content-output">{result.content}</pre>
        </div>
      )}
    </form>
  );
}
