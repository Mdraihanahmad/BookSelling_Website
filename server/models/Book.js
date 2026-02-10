const mongoose = require('mongoose');

/**
 * Book Schema
 * Stores local URLs for thumbnail and pdf.
 */
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    pdfUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
