import { useEffect, useState } from 'react';
import api from '../services/api';
import BookCard, { BookCardSkeleton } from '../components/BookCard';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setError('');
        const { data } = await api.get('/api/books');
        if (mounted) setBooks(data.books || []);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || 'Failed to load books');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredBooks = !normalizedQuery
    ? books
    : books.filter((b) => {
        const title = String(b?.title || '').toLowerCase();
        const description = String(b?.description || '').toLowerCase();
        return title.includes(normalizedQuery) || description.includes(normalizedQuery);
      });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-sm sm:p-6">
        <div className="inline-flex items-center rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          Premium digital reads
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Discover your next book
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Browse curated PDFs with instant access after purchase.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200/70 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}

      <section className="mt-8" aria-busy={loading ? 'true' : 'false'}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">All books</h2>
            <p className="mt-1 text-sm text-slate-600">Click a book to view details and buy.</p>
          </div>
          <div className="hidden text-sm text-slate-500 sm:block">
            {!loading && !error ? `${filteredBooks.length} item${filteredBooks.length === 1 ? '' : 's'}` : ''}
          </div>
        </div>

        <div className="mt-4">
          <label className="sr-only" htmlFor="book-search">
            Search books
          </label>
          <input
            id="book-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or description…"
            className="w-full rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
              <span className="sr-only">Loading books…</span>
            </>
          )}

          {!loading && !error && filteredBooks.map((b) => <BookCard key={b._id} book={b} />)}

          {!loading && !error && books.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-sm">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <span className="text-lg font-semibold">—</span>
                </div>
                <div className="mt-4 text-sm font-semibold text-slate-900">No books yet</div>
                <div className="mt-1 text-sm text-slate-600">Please check back soon.</div>
              </div>
            </div>
          )}

          {!loading && !error && books.length > 0 && filteredBooks.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-sm">
                <div className="mt-1 text-sm font-semibold text-slate-900">No matches</div>
                <div className="mt-1 text-sm text-slate-600">Try a different search term.</div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
