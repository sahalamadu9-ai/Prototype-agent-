'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

type ProjectFormProps = {
  workspaceId: string;
  onCreated?: () => void;
};

export default function ProjectForm({ workspaceId, onCreated }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId,
          name,
          description,
          type: 'content',
        }),
      });

      setName('');
      setDescription('');
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="section-card">
      <div className="section-heading">
        <h2>Create project</h2>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd' }}
          required
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Project description"
          rows={4}
          style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd' }}
        />

        {error ? <small style={{ color: '#b91c1c' }}>{error}</small> : null}

        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create project'}
        </button>
      </div>
    </form>
  );
}
