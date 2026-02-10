const express = require('express');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const dbRequired = require('../middleware/dbRequired');
const { uploadBookAssets } = require('../config/multer');

const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  streamBookPdf,
} = require('../controllers/bookController');

const router = express.Router();

// Public
router.get('/', dbRequired, getAllBooks);
router.get('/:id', dbRequired, getBookById);

// Protected PDF access (purchased only)
router.get('/:id/pdf', dbRequired, auth, streamBookPdf);

// Admin CRUD
router.post(
  '/',
  dbRequired,
  auth,
  admin,
  uploadBookAssets.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  createBook
);

router.put(
  '/:id',
  dbRequired,
  auth,
  admin,
  uploadBookAssets.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  updateBook
);

router.delete('/:id', dbRequired, auth, admin, deleteBook);

module.exports = router;
