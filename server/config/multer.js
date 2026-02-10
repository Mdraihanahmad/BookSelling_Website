const path = require('path');
const multer = require('multer');

function usingBlobStorage() {
  // When deployed on Vercel with Vercel Blob connected, BLOB_READ_WRITE_TOKEN will be present.
  // Vercel's filesystem is ephemeral, so we must not rely on disk persistence.
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN) || String(process.env.USE_BLOB_STORAGE || '').toLowerCase() === 'true';
}

function safeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${base}_${Date.now()}${ext}`;
}

const storage = usingBlobStorage()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        if (file.fieldname === 'thumbnail') {
          return cb(null, 'uploads/thumbnails');
        }
        if (file.fieldname === 'pdf') {
          return cb(null, 'uploads/pdfs');
        }
        return cb(new Error('Invalid upload field'), 'uploads');
      },
      filename: (req, file, cb) => {
        cb(null, safeFilename(file.originalname));
      },
    });

function fileFilter(req, file, cb) {
  if (file.fieldname === 'thumbnail') {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    return cb(ok ? null : new Error('Thumbnail must be jpg/png/webp'), ok);
  }

  if (file.fieldname === 'pdf') {
    const ok = file.mimetype === 'application/pdf';
    return cb(ok ? null : new Error('PDF must be application/pdf'), ok);
  }

  return cb(new Error('Invalid upload field'), false);
}

const uploadBookAssets = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

module.exports = {
  uploadBookAssets,
};
