import { Link } from 'react-router-dom';

export function BookCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-slate-100" />
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
  const thumbnailSrc = book?.thumbnailUrl
    ? /^https?:\/\//i.test(book.thumbnailUrl)
      ? book.thumbnailUrl
      : `${import.meta.env.VITE_API_BASE_URL || ''}${book.thumbnailUrl}`
    : '';

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
