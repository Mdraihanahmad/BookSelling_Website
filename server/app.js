const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const Book = require('./models/Book');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static: thumbnails are public
app.use('/uploads/thumbnails', express.static(path.join(__dirname, 'uploads', 'thumbnails')));

// Health check
app.get('/api/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    ok: true,
    service: 'sellb-server',
    timestamp: new Date().toISOString(),
    db: {
      state: stateMap[readyState] || 'unknown',
    },
  });
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(value, maxLen) {
  const str = String(value || '').replace(/\s+/g, ' ').trim();
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return `${str.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

// Share landing page (server-rendered for OG previews)
app.get('/api/share/book/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id).select('title description thumbnailUrl price').lean();
    if (!book) {
      res.status(404).type('html').send('<!doctype html><html><head><meta charset="utf-8"><title>Not found</title></head><body>Not found</body></html>');
      return;
    }

    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    const baseUrl = host ? `${proto}://${host}` : '';

    const shareUrl = baseUrl ? `${baseUrl}/s/${book._id}` : `/s/${book._id}`;
    const destinationPath = `/books/${book._id}`;

    let ogImage = '';
    if (book.thumbnailUrl) {
      if (/^https?:\/\//i.test(book.thumbnailUrl)) ogImage = book.thumbnailUrl;
      else if (baseUrl) ogImage = `${baseUrl}${book.thumbnailUrl.startsWith('/') ? '' : '/'}${book.thumbnailUrl}`;
      else ogImage = book.thumbnailUrl;
    }

    const title = escapeHtml(book.title || 'Sellb Book');
    const description = escapeHtml(truncate(book.description || 'Buy this book on Sellb.', 200));
    const price = book.price != null ? `₹${escapeHtml(book.price)}` : '';

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}${price ? ` • ${price}` : ''} | Sellb</title>
    <link rel="canonical" href="${shareUrl}" />
    <meta name="description" content="${description}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Sellb" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${shareUrl}" />
    ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : ''}

    <meta http-equiv="refresh" content="0;url=${destinationPath}" />
  </head>
  <body>
    <noscript>
      <p>Continue to <a href="${destinationPath}">book page</a>.</p>
    </noscript>
    <script>
      window.location.replace(${JSON.stringify(destinationPath)});
    </script>
  </body>
</html>`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    next(err);
  }
});

// Routes
// Note: On Vercel, /api/auth/* may conflict with platform auth/protection routes.
// Use a different prefix for app auth endpoints.
app.use('/api/account', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
