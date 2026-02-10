import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold text-slate-900">
          <span className="text-slate-700">Sellb</span>{' '}
          <span className="text-slate-400">•</span>{' '}
          <span className="text-sm font-medium text-slate-500">Digital books</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link
            to="/"
            className="font-medium text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
          >
            Books
          </Link>
          <Link
            to="/dashboard"
            className="font-medium text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
          >
            Dashboard
          </Link>
          <a
            href="mailto:support@yourdomain.com"
            className="font-medium text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
          >
            Support
          </a>
        </nav>
      </div>
    </footer>
  );
}
