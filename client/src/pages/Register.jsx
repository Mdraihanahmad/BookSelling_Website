import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputBase =
    'w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100';

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-sm sm:p-6">
          <div className="inline-flex items-center rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Get started
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Register</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Create an account to buy and read books.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-800">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                required
                placeholder="Your name"
                className={`mt-2 ${inputBase}`}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="you@example.com"
                className={`mt-2 ${inputBase}`}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                className={`mt-2 ${inputBase}`}
                autoComplete="new-password"
              />
              <div className="mt-1 text-xs text-slate-500">Use at least 6 characters.</div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200/70 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </div>

          <div className="mt-5 text-sm text-slate-600">
            Already have an account?{' '}
            <Link className="font-semibold text-indigo-700 hover:text-indigo-800" to="/login">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
