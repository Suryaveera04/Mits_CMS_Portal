const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  authors: { type: String, trim: true },
  venue: { type: String, trim: true },
  publisher: { type: String, trim: true },
  doi: { type: String, trim: true },
  issn: { type: String, trim: true },
  year: { type: String, trim: true },
  indexing: { type: String, trim: true },
  abstract: { type: String, trim: true },
  tags: [{ type: String }],
  pdfUrl: { type: String, default: null },
  externalLink: { type: String, trim: true },
  citationCount: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft','Published'], default: 'Draft' },
}, { timestamps: true });

module.exports = mongoose.model('Publication', publicationSchema);
