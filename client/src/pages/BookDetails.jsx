import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { loadRazorpayScript } from '../utils/loadRazorpay';

function TrustBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
          <path
            fill="currentColor"
            d="M9 16.2 4.8 12l1.4-1.4L9 13.4 17.8 4.6 19.2 6l-10.2 10.2Z"
          />
        </svg>
      </span>
      {children}
    </span>
  );
}

export default function BookDetails() {
  const { id } = useParams();
  const { user, reload } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');

  const thumbnailSrc = useMemo(() => {
    if (!book?.thumbnailUrl) return '';
    if (/^https?:\/\//i.test(book.thumbnailUrl)) return book.thumbnailUrl;
    return `${import.meta.env.VITE_API_BASE_URL}${book.thumbnailUrl}`;
  }, [book]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setError('');
        const { data } = await api.get(`/api/books/${id}`);
        if (mounted) setBook(data.book);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || 'Failed to load book');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleBuy() {
    if (!user) {
      setMessage('Please login to buy this book.');
      return;
    }

    setPaying(true);
    setMessage('');

    try {
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error('Razorpay script failed to load');

      const { data } = await api.post('/api/payments/create-order', { bookId: id });

      const options = {
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Sellb',
        description: data.book?.title || 'Book Purchase',
        order_id: data.razorpayOrderId,
        handler: async function (response) {
          try {
            await api.post('/api/payments/verify', {
              bookId: id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await reload();
            navigate('/dashboard', { state: { justPaid: true }, replace: true });
          } catch (e) {
            const status = e?.response?.status;
            const serverMsg = e?.response?.data?.message;
            setMessage(status ? `${status}: ${serverMsg || 'Payment verification failed'}` : serverMsg || 'Payment verification failed');
          }
        },
        prefill: {
          email: user.email,
          name: user.name,
        },
        theme: {
          color: '#0f172a',
        },
      };

      // eslint-disable-next-line no-undef
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        setMessage('Payment failed. Please try again.');
      });
      rzp.open();
    } catch (e) {
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message;
      const fallback = e?.message || 'Failed to start payment';
      setMessage(status ? `${status}: ${serverMsg || fallback}` : serverMsg || fallback);
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="aspect-[4/3] animate-pulse overflow-hidden rounded-3xl border border-slate-200/70 bg-slate-100" />
            <div className="h-7 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-11/12 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-10/12 animate-pulse rounded bg-slate-100" />
            </div>
          </div>

          <div className="h-[360px] animate-pulse rounded-3xl border border-slate-200/70 bg-white/70 shadow-sm" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-red-200/70 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      {message && (
        <div className="fixed right-4 top-[4.75rem] z-50 w-[min(420px,calc(100vw-2rem))]">
          <div
            role="status"
            className="rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-lg backdrop-blur"
          >
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
                <div className="text-sm font-semibold text-slate-900">Notice</div>
                <div className="mt-0.5 text-sm text-slate-700">{message}</div>
              </div>
              <button
                type="button"
                onClick={() => setMessage('')}
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
                aria-label="Dismiss message"
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
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
        >
          <span className="text-slate-400">←</span>
          Back to books
        </Link>

        {user && (
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
          >
            Go to Dashboard
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50 shadow-sm">
            <div className="relative">
              <div className="aspect-[4/3] bg-slate-100">
                {thumbnailSrc ? (
                  <img
                    alt={book.title}
                    src={thumbnailSrc}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                    No preview available
                  </div>
                )}
              </div>
              <div className="absolute left-4 top-4">
                <span className="inline-flex items-center rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                  PDF
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {book.title}
              </h1>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {book.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <TrustBadge>Secure checkout</TrustBadge>
                <TrustBadge>Instant access</TrustBadge>
                <TrustBadge>Download anytime</TrustBadge>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Price</div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                  ₹{book.price}
                </div>
                <div className="mt-1 text-sm text-slate-600">One-time purchase</div>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                Razorpay
              </span>
            </div>

            <button
              onClick={handleBuy}
              disabled={paying}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {paying ? 'Processing…' : 'Buy now'}
            </button>

            {!user && (
              <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Login required</div>
                <div className="mt-1 text-sm text-slate-600">
                  <Link className="font-semibold text-indigo-700 hover:text-indigo-800" to="/login">
                    Login
                  </Link>{' '}
                  to purchase and access your library.
                </div>
              </div>
            )}

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-3">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                    <path
                      fill="currentColor"
                      d="M12 1 3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-4Zm0 20c-4.2-1.2-7-5.2-7-10V6.3L12 3l7 3.3V11c0 4.8-2.8 8.8-7 10Z"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Secure payment</div>
                  <div className="mt-0.5 text-sm text-slate-600">Trusted checkout with Razorpay.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-3">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                    <path
                      fill="currentColor"
                      d="M7 3h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Zm0 2v11.8l2-1 4 2 4-2 2 1V5H7Z"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Instant PDF access</div>
                  <div className="mt-0.5 text-sm text-slate-600">Read online or download in Dashboard.</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
