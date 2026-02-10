import { useEffect, useState } from 'react';
import api from '../services/api';

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function Field({ label, helper, children }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800">{label}</label>
      {helper ? <div className="mt-0.5 text-xs text-slate-500">{helper}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [b, o] = await Promise.all([api.get('/api/books'), api.get('/api/orders')]);
      setBooks(b.data.books || []);
      setOrders(o.data.orders || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createBook(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('price', price);
      form.append('thumbnail', thumbnail);
      form.append('pdf', pdf);

      await api.post('/api/books', form);

      setTitle('');
      setDescription('');
      setPrice('');
      setThumbnail(null);
      setPdf(null);
      setMsg('Book uploaded');
      await loadAll();
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  }

  async function deleteBook(id) {
    if (!confirm('Delete this book?')) return;
    try {
      await api.delete(`/api/books/${id}`);
      await loadAll();
    } catch (e) {
      setError(e?.response?.data?.message || 'Delete failed');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="h-7 w-32 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm" />
          ))}
        </div>
        <div className="mt-8 h-96 animate-pulse rounded-3xl border border-slate-200/70 bg-white/70 shadow-sm" />
      </div>
    );
  }

  const totalBooks = books.length;
  const totalOrders = orders.length;
  const successfulOrders = orders.filter((o) => o.paymentStatus === 'success');
  const totalRevenuePaise = successfulOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const totalRevenueInr = (totalRevenuePaise / 100).toFixed(2);

  const tabButtonBase =
    'inline-flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2';
  const inputBase =
    'w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-sm sm:p-6">
        <div className="inline-flex items-center rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          Admin console
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Admin</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Upload books and review orders.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Books" value={totalBooks} hint="Books available in catalog" />
        <StatCard label="Total Orders" value={totalOrders} hint="All purchase attempts" />
        <StatCard label="Revenue" value={`₹${totalRevenueInr}`} hint="Successful payments" />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200/70 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}
      {msg && (
        <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-700 shadow-sm">
          {msg}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200/70 bg-white/80 p-3 shadow-sm backdrop-blur">
          <div className="px-2 pb-2 pt-1 text-xs font-semibold tracking-wide text-slate-500">
            Navigation
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setTab('books')}
              className={`${tabButtonBase} ${tab === 'books' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <span>Books</span>
              <span className={`text-xs ${tab === 'books' ? 'text-white/90' : 'text-slate-500'}`}>{totalBooks}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`${tabButtonBase} ${tab === 'orders' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <span>Orders</span>
              <span className={`text-xs ${tab === 'orders' ? 'text-white/90' : 'text-slate-500'}`}>{totalOrders}</span>
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-700">Quick info</div>
            <div className="mt-1 text-xs text-slate-600">Revenue from successful orders only.</div>
          </div>
        </aside>

        <main>
          {tab === 'books' && (
            <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
              <form onSubmit={createBook} className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Upload new book</div>
                    <div className="mt-1 text-xs text-slate-600">Provide title, description, price, thumbnail and PDF.</div>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    New
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <Field label="Title" helper="Keep it clear and searchable.">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputBase} required />
                  </Field>

                  <Field label="Description" helper="Short pitch + what the reader will learn.">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`${inputBase} min-h-[120px] resize-y`}
                      rows={5}
                      required
                    />
                  </Field>

                  <Field label="Price (INR)" helper="Whole number recommended.">
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      type="number"
                      min={0}
                      step="1"
                      className={inputBase}
                      required
                    />
                  </Field>

                  <Field label="Thumbnail" helper="JPG/PNG, used in grid and details page.">
                    <input
                      onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-95"
                      required
                    />
                  </Field>

                  <Field label="PDF" helper="Application/pdf only.">
                    <input
                      onChange={(e) => setPdf(e.target.files?.[0] || null)}
                      type="file"
                      accept="application/pdf"
                      className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-95"
                      required
                    />
                  </Field>
                </div>

                <button
                  disabled={saving}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {saving ? 'Uploading…' : 'Upload book'}
                </button>
              </form>

              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Existing books</div>
                    <div className="mt-1 text-xs text-slate-600">Manage your catalog entries.</div>
                  </div>
                  <div className="hidden text-sm text-slate-500 sm:block">
                    {totalBooks} item{totalBooks === 1 ? '' : 's'}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {books.map((b) => (
                    <div
                      key={b._id}
                      className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 line-clamp-1">{b.title}</div>
                        <div className="mt-0.5 text-xs text-slate-600">₹{b.price}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteBook(b._id)}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 sm:w-auto"
                      >
                        Delete
                      </button>
                    </div>
                  ))}

                  {books.length === 0 && (
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-700">
                      No books yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Orders</div>
                  <div className="mt-1 text-xs text-slate-600">Review payment status and Razorpay IDs.</div>
                </div>
                <div className="hidden text-sm text-slate-500 sm:block">{totalOrders} total</div>
              </div>

              <div className="mt-4 overflow-auto rounded-2xl border border-slate-200/70 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Book</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Razorpay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {orders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-slate-700">{o.userId?.email}</td>
                        <td className="px-4 py-3 text-slate-700">{o.bookId?.title}</td>
                        <td className="px-4 py-3 text-slate-700">₹{(o.amount / 100).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              o.paymentStatus === 'success'
                                ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700'
                                : o.paymentStatus === 'failed'
                                  ? 'border-red-200/70 bg-red-50 text-red-700'
                                  : 'border-slate-200/70 bg-slate-50 text-slate-700'
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-slate-600">{o.razorpayOrderId}</div>
                          {o.razorpayPaymentId && <div className="mt-0.5 text-xs text-slate-600">{o.razorpayPaymentId}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {orders.length === 0 && (
                  <div className="p-5 text-sm text-slate-700">No orders yet.</div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
