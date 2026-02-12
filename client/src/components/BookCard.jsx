import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBaseUrl } from '../services/api';

export function BookCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm">
      <div className="relative aspect-[4/3] animate-pulse bg-slate-100">
        <div className="absolute right-3 top-3 h-7 w-16 rounded-full bg-white/70" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export default function BookCard({ book }) {
  const [shareStatus, setShareStatus] = useState('');

  const assetBaseUrl = useMemo(() => {
    return getApiBaseUrl();
  }, []);

  const thumbnailSrc = book?.thumbnailUrl
    ? /^https?:\/\//i.test(book.thumbnailUrl)
      ? book.thumbnailUrl
      : `${assetBaseUrl}${book.thumbnailUrl}`
    : '';

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    if (!book?._id) return '';
    return `${window.location.origin}/s/${book._id}`;
  }, [book?._id]);

  useEffect(() => {
    if (!shareStatus) return;
    const t = setTimeout(() => setShareStatus(''), 2000);
    return () => clearTimeout(t);
  }, [shareStatus]);

  async function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!shareUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: book?.title || 'Sellb',
          text: 'Check out this book on Sellb',
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus('Copied');
        return;
      }

      window.prompt('Copy this link:', shareUrl);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setShareStatus('Failed');
    }
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/70 hover:shadow-md">
      <Link
        to={`/books/${book._id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
        aria-label={`View details for ${book?.title || 'book'}`}
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

          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center rounded-full bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              ₹{book.price}
            </span>
          </div>

          <div className="absolute right-3 top-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2"
              aria-label="Share this book"
              title={shareStatus ? shareStatus : 'Share'}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 text-slate-700">
                <path
                  fill="currentColor"
                  d="M18 16.1c-.8 0-1.6.3-2.1.9l-7.1-4.1c.1-.3.2-.6.2-.9s-.1-.6-.2-.9l7-4.1c.6.6 1.3 1 2.2 1 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .3.1.6.2.9l-7 4.1c-.6-.6-1.4-1-2.2-1-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.6-.3 2.2-.9l7.1 4.1c-.1.2-.1.5-.1.7 0 1.7 1.3 3 3 3s3-1.3 3-3-1.3-3-3-3Z"
                />
              </svg>
              <span className="hidden sm:inline">{shareStatus || 'Share'}</span>
              <span className="sm:hidden">{shareStatus ? shareStatus : 'Share'}</span>
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
            {book.title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-600 line-clamp-2">
            {book.description}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Instant PDF access</span>
            <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition group-hover:opacity-95">
              Buy now
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
