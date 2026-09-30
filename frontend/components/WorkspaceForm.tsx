'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

type WorkspaceFormProps = {
  onCreated?: () => void;
};

export default function WorkspaceForm({ onCreated }: WorkspaceFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch('/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
        }),
      });

      setName('');
      setDescription('');
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="section-card">
      <div className="section-heading">
        <h2>Create workspace</h2>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workspace name"
          style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd' }}
          required
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={4}
          style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd' }}
        />

        {error ? <small style={{ color: '#b91c1c' }}>{error}</small> : null}

        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create workspace'}
        </button>
      </div>
    </form>
  );
}
