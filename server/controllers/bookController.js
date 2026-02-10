const fs = require('fs');
const path = require('path');

const Book = require('../models/Book');

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function usingBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN) || String(process.env.USE_BLOB_STORAGE || '').toLowerCase() === 'true';
}

function safePathPart(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const base = path
    .basename(originalName || 'file', ext)
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 80);
  return `${base || 'file'}_${Date.now()}${ext || ''}`;
}

async function blobPut(pathname, body, options) {
  const mod = await import('@vercel/blob');
  return mod.put(pathname, body, options);
}

async function blobHead(urlOrPathname, options) {
  const mod = await import('@vercel/blob');
  return mod.head(urlOrPathname, options);
}

/**
 * GET /api/books
 * Public: list all books.
 */
async function getAllBooks(req, res, next) {
  try {
    // Never expose pdfUrl publicly (it may be a direct blob URL).
    const books = await Book.find({}).select('-pdfUrl').sort({ createdAt: -1 });
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/books/:id
 * Public: book details.
 */
async function getBookById(req, res, next) {
  try {
    // Never expose pdfUrl publicly (it may be a direct blob URL).
    const book = await Book.findById(req.params.id).select('-pdfUrl');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/books
 * Admin: create a book with multipart/form-data.
 * Fields: title, description, price
 * Files: thumbnail (image), pdf (application/pdf)
 */
async function createBook(req, res, next) {
  try {
    const { title, description, price } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({ message: 'title, description, price are required' });
    }

    if (!req.files?.thumbnail?.[0] || !req.files?.pdf?.[0]) {
      return res.status(400).json({ message: 'thumbnail and pdf files are required' });
    }

    const thumbnailFile = req.files.thumbnail[0];
    const pdfFile = req.files.pdf[0];

    let thumbnailPath;
    let pdfPath;

    if (usingBlobStorage()) {
      if (!thumbnailFile.buffer || !pdfFile.buffer) {
        return res.status(400).json({ message: 'Upload failed: missing file buffers (blob storage mode)' });
      }

      const thumbnailBlob = await blobPut(
        `sellb/thumbnails/${safePathPart(thumbnailFile.originalname)}`,
        thumbnailFile.buffer,
        { access: 'public', addRandomSuffix: true, contentType: thumbnailFile.mimetype }
      );

      const pdfBlob = await blobPut(
        `sellb/pdfs/${safePathPart(pdfFile.originalname || 'book.pdf')}`,
        pdfFile.buffer,
        { access: 'public', addRandomSuffix: true, contentType: pdfFile.mimetype }
      );

      thumbnailPath = thumbnailBlob.url;
      pdfPath = pdfBlob.url;
    } else {
      thumbnailPath = `/uploads/thumbnails/${thumbnailFile.filename}`;
      pdfPath = `/uploads/pdfs/${pdfFile.filename}`;
    }

    const book = await Book.create({
      title,
      description,
      price: Number(price),
      thumbnailUrl: thumbnailPath,
      pdfUrl: pdfPath,
    });

    // Don't return pdfUrl to the client.
    const safeBook = await Book.findById(book._id).select('-pdfUrl');
    return res.status(201).json({ book: safeBook });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/books/:id
 * Admin: update a book, optionally replacing thumbnail/pdf.
 */
async function updateBook(req, res, next) {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const { title, description, price } = req.body;

    if (title !== undefined) book.title = title;
    if (description !== undefined) book.description = description;
    if (price !== undefined) book.price = Number(price);

    // Replace files if provided
    if (req.files?.thumbnail?.[0]) {
      const f = req.files.thumbnail[0];
      if (usingBlobStorage()) {
        if (!f.buffer) {
          return res.status(400).json({ message: 'Upload failed: missing thumbnail buffer (blob storage mode)' });
        }
        const blob = await blobPut(
          `sellb/thumbnails/${safePathPart(f.originalname)}`,
          f.buffer,
          { access: 'public', addRandomSuffix: true, contentType: f.mimetype }
        );
        book.thumbnailUrl = blob.url;
      } else {
        book.thumbnailUrl = `/uploads/thumbnails/${f.filename}`;
      }
    }

    if (req.files?.pdf?.[0]) {
      const f = req.files.pdf[0];
      if (usingBlobStorage()) {
        if (!f.buffer) {
          return res.status(400).json({ message: 'Upload failed: missing pdf buffer (blob storage mode)' });
        }
        const blob = await blobPut(
          `sellb/pdfs/${safePathPart(f.originalname || 'book.pdf')}`,
          f.buffer,
          { access: 'public', addRandomSuffix: true, contentType: f.mimetype }
        );
        book.pdfUrl = blob.url;
      } else {
        book.pdfUrl = `/uploads/pdfs/${f.filename}`;
      }
    }

    await book.save();
    const safeBook = await Book.findById(book._id).select('-pdfUrl');
    return res.json({ book: safeBook });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/books/:id
 * Admin: delete a book.
 * (Note: this does not delete files from disk in this MVP.)
 */
async function deleteBook(req, res, next) {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await book.deleteOne();
    return res.json({ message: 'Book deleted' });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/books/:id/pdf
 * Protected: stream PDF only if user purchased it (or is admin).
 * Query: ?download=true to force download.
 */
async function streamBookPdf(req, res, next) {
  try {
    const bookId = req.params.id;
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const isAdmin = req.user?.role === 'admin';
    const hasPurchased = req.user?.purchasedBooks?.some((id) => String(id) === String(bookId));

    if (!isAdmin && !hasPurchased) {
      return res.status(403).json({ message: 'You have not purchased this book' });
    }

    const download = String(req.query.download || 'false').toLowerCase() === 'true';

    // If pdfUrl is a blob/http URL, redirect after authorization.
    if (isHttpUrl(book.pdfUrl)) {
      if (!download) {
        return res.redirect(302, book.pdfUrl);
      }
      // Use head() to retrieve the canonical downloadUrl.
      const meta = await blobHead(book.pdfUrl);
      return res.redirect(302, meta.downloadUrl);
    }

    // Local disk mode: book.pdfUrl is like /uploads/pdfs/<file>
    const relative = String(book.pdfUrl || '').replace(/^\//, '');
    const filePath = path.resolve(__dirname, '..', relative);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'PDF file not found on server' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', download ? `attachment; filename="${book.title}.pdf"` : 'inline');

    const stream = fs.createReadStream(filePath);
    stream.on('error', (e) => next(e));
    return stream.pipe(res);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  streamBookPdf,
};
