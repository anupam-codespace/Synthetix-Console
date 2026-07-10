'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layers, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Authentication failed. Please check details.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-sm space-y-6">
        
        {/* Brand Logo */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight uppercase">Synthetix Console</h1>
          <p className="text-xs text-zinc-400">
            Secure sign-in for job execution & worker pools
          </p>
        </div>

        {/* Demo Credentials Alert Banner */}
        <div className="rounded-lg border border-emerald-950/40 bg-emerald-500/5 p-3 text-xs text-emerald-400">
          <p className="font-semibold mb-0.5">Quick Play Credentials</p>
          <p className="font-mono text-[11px] opacity-90">
            Email: <span className="underline">admin@synthetix.dev</span><br />
            Password: <span className="underline">adminpass</span>
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-950/40 bg-rose-500/5 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Card Form */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xxs font-bold uppercase tracking-wider text-zinc-400">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="h-9 w-full rounded border border-zinc-850 bg-zinc-950 px-3 text-xs outline-none focus:border-zinc-700 transition-colors"
                placeholder="developer@synthetix.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xxs font-bold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="h-9 w-full rounded border border-zinc-850 bg-zinc-950 px-3 text-xs outline-none focus:border-zinc-700 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-9 w-full items-center justify-center rounded bg-white text-xs font-semibold text-zinc-950 hover:bg-zinc-150 transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center text-xxs text-zinc-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-zinc-200 hover:underline">
              Create an account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
