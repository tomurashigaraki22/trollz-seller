'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, isAuthenticated } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Icon from '@/components/Icon';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';

export default function LoginPage() {
  const router = useRouter();
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.replace('/dashboard');
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!creds.email.trim() || !creds.password.trim())
        throw new Error('Please enter your email and password');
      const res = await apiClient.sellerLogin(creds.email, creds.password);
      const token = res.data?.token || res.access_token || res.token;
      if (!token) throw new Error('No token received from server');
      login(token, res.data?.seller || res.data?.user || {});
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-base)', backgroundImage: 'var(--grad-page)' }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(254,76,28,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(254,76,28,0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative w-full max-w-[400px] anim-up">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-5"
            style={{
              background: 'var(--grad-primary)',
              boxShadow: '0 0 0 1px rgba(254,76,28,0.3), 0 8px 24px rgba(254,76,28,0.18)',
            }}
          >
            <span className="text-3xl font-black text-white">T</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-base)' }}>
            Seller Portal
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            Sign in to manage your store on Trollz
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-8 relative"
          style={{
            background: 'var(--bg-elevated)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Top shine line */}
          <div
            className="absolute top-0 left-8 right-8 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, var(--border-strong), transparent)' }}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={creds.email}
                onChange={(e) => setCreds({ ...creds, email: e.target.value })}
                placeholder="seller@example.com"
                autoComplete="email"
                className="ts-input"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={creds.password}
                onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                className="ts-input"
              />
            </div>

            {error && (
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--danger-bg)',
                  boxShadow: '0 0 0 1px var(--danger-border)',
                  color: 'var(--danger-text)',
                }}
              >
                <Icon icon={AlertCircleIcon} size={18} style={{ color: 'var(--danger-text)' }} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="ts-btn-primary ts-btn-lg w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div
            className="mt-6 pt-5 text-center"
            style={{ borderTop: '1px solid var(--border-muted)' }}
          >
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Access is granted by the Trollz admin team.
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Contact your admin if you don't have an account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

