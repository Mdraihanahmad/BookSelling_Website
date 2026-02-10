/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const connectDB = require('../config/db');
const Book = require('../models/Book');

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
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

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN && String(process.env.USE_BLOB_STORAGE || '').toLowerCase() !== 'true') {
    console.error('Missing BLOB_READ_WRITE_TOKEN. Connect a Vercel Blob store and pull env vars (vercel env pull).');
    process.exit(1);
  }

  await connectDB();

  const books = await Book.find({});
  console.log(`Found ${books.length} books`);

  let updated = 0;
  let skipped = 0;
  let missingFiles = 0;

  for (const book of books) {
    const needsThumb = book.thumbnailUrl && !isHttpUrl(book.thumbnailUrl) && String(book.thumbnailUrl).startsWith('/uploads/');
    const needsPdf = book.pdfUrl && !isHttpUrl(book.pdfUrl) && String(book.pdfUrl).startsWith('/uploads/');

    if (!needsThumb && !needsPdf) {
      skipped += 1;
      continue;
    }

    console.log(`\nMigrating: ${book._id} — ${book.title}`);

    try {
      if (needsThumb) {
        const rel = String(book.thumbnailUrl).replace(/^\//, '');
        const localPath = path.resolve(rel);
        if (!fs.existsSync(localPath)) {
          console.warn(`  Thumbnail missing: ${localPath}`);
          missingFiles += 1;
        } else {
          const buf = fs.readFileSync(localPath);
          const originalName = path.basename(localPath);
          const blob = await blobPut(
            `sellb/thumbnails/${safePathPart(originalName)}`,
            buf,
            { access: 'public', addRandomSuffix: true }
          );
          book.thumbnailUrl = blob.url;
          console.log(`  Thumbnail -> ${blob.url}`);
        }
      }

      if (needsPdf) {
        const rel = String(book.pdfUrl).replace(/^\//, '');
        const localPath = path.resolve(rel);
        if (!fs.existsSync(localPath)) {
          console.warn(`  PDF missing: ${localPath}`);
          missingFiles += 1;
        } else {
          const buf = fs.readFileSync(localPath);
          const originalName = path.basename(localPath);
          const blob = await blobPut(
            `sellb/pdfs/${safePathPart(originalName || 'book.pdf')}`,
            buf,
            { access: 'public', addRandomSuffix: true, contentType: 'application/pdf' }
          );
          book.pdfUrl = blob.url;
          console.log(`  PDF -> ${blob.url}`);
        }
      }

      await book.save();
      updated += 1;
    } catch (err) {
      console.error('  Failed:', err?.message || err);
    }
  }

  console.log('\nDone');
  console.log({ updated, skipped, missingFiles });
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
