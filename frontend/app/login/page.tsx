'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { setStoredToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@zapcart.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setStoredToken(response.token);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        }}
      >
        <p className="eyebrow">WELCOME BACK</p>
        <h1 style={{ marginTop: 8, marginBottom: 24 }}>Log in</h1>

        <div style={{ display: 'grid', gap: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd' }}
            required
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd' }}
            required
          />

          {error ? <small style={{ color: '#b91c1c' }}>{error}</small> : null}

          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <a href="/register" style={{ textAlign: 'center', color: '#7c3aed', fontWeight: 600 }}>
            Create account
          </a>
        </div>
      </form>
    </main>
  );
}
