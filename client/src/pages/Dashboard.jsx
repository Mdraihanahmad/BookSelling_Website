import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

function StatusBadge({ status }) {
  const normalized = String(status || '').toLowerCase();
  const cls =
    normalized === 'success'
      ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700'
      : normalized === 'failed'
        ? 'border-red-200/70 bg-red-50 text-red-700'
        : 'border-slate-200/70 bg-slate-50 text-slate-700';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status || 'unknown'}
    </span>
  );
}

function Toast({ title, message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed right-4 top-[4.75rem] z-50 w-[min(420px,calc(100vw-2rem))]">
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-lg backdrop-blur">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 14h-2v-2h2v2Zm0-4h-2V6h2v6Z"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{title || 'Notice'}</div>
            <div className="mt-0.5 text-sm text-slate-700">{message}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
            aria-label="Dismiss"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.29l6.29 6.3 6.3-6.3 1.41 1.42Z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function LibraryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="flex gap-2 pt-2">
          <div className="h-9 flex-1 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-9 flex-1 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const assetBaseUrl = useMemo(() => {
    return import.meta.env.PROD ? '' : import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  }, []);
  const [toast, setToast] = useState('');

  const purchased = useMemo(
    () => orders.filter((o) => o.paymentStatus === 'success' && o.bookId),
    [orders]
  );

  useEffect(() => {
    const justPaid = Boolean(location.state?.justPaid);
    if (!justPaid) return;

    setToast('Payment successful. Your book is now in your library. Use Read or Download.');
    const t = setTimeout(() => setToast(''), 6000);

    // Clear router state so the popup doesn't show again on refresh.
    navigate('/dashboard', { replace: true });
    return () => clearTimeout(t);
  }, [location.state, navigate]);

  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      try {
        const { data } = await api.get('/api/orders/my');
        if (mounted) setOrders(data.orders || []);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || 'Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadOrders();
    return () => {
      mounted = false;
    };
  }, []);

  async function readPdf(book) {
    try {
      const resp = await api.get(`/api/books/${book._id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(resp.data);
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (!w) {
        setToast('Popup blocked. Please allow popups to read in a new tab.');
      }
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      setToast(e?.response?.data?.message || 'Failed to open PDF');
    }
  }

  async function downloadPdf(book) {
    try {
      const resp = await api.get(`/api/books/${book._id}/pdf?download=true`, { responseType: 'blob' });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setToast(e?.response?.data?.message || 'Failed to download PDF');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="h-7 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LibraryCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <Toast title="Success" message={toast} onClose={() => setToast('')} />

      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-sm sm:p-6">
        <div className="inline-flex items-center rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          Your library
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          My Books
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Purchased books are available to read online and download as PDF.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200/60 bg-rose-50 p-4 text-sm text-rose-700">
                      : `${assetBaseUrl}${book.thumbnailUrl}`
        </div>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Purchased</h2>
            <p className="mt-1 text-sm text-slate-600">Access your purchased PDFs anytime.</p>
          </div>
          <div className="hidden text-sm text-slate-500 sm:block">
            {purchased.length} item{purchased.length === 1 ? '' : 's'}
          </div>
        </div>

        {purchased.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-sm">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                <path
                  fill="currentColor"
                  d="M7 3h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Zm0 2v11.8l2-1 4 2 4-2 2 1V5H7Z"
                />
              </svg>
            </div>
            <div className="mt-4 text-sm font-semibold text-slate-900">No purchases yet</div>
            <div className="mt-1 text-sm text-slate-600">Head to the Books page to buy your first PDF.</div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {purchased.map((o) => {
              const book = o.bookId;
              const thumbnailSrc = book?.thumbnailUrl
                ? /^https?:\/\//i.test(book.thumbnailUrl)
                  ? book.thumbnailUrl
                  : `${import.meta.env.VITE_API_BASE_URL || ''}${book.thumbnailUrl}`
                : '';

              return (
                <article
                  key={o._id}
                  className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/70 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-50">
                    {thumbnailSrc ? (
                      <img
                        alt={book.title}
                        src={thumbnailSrc}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                        No preview
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                        ₹{(o.amount / 100).toFixed(2)}
                      </span>
                      <StatusBadge status={o.paymentStatus} />
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-sm font-semibold text-slate-900 line-clamp-1">{book.title}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Purchase type: <span className="font-semibold text-slate-700">One-time</span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => readPdf(book)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
                      >
                        Read
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPdf(book)}
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
                      >
                        Download
                      </button>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">Tip: Use Download to save offline.</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
