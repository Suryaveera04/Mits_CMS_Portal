const mongoose = require('mongoose');

const patentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  patentType: { type: String, trim: true },
  inventors: { type: String, trim: true },
  department: { type: String, trim: true },
  patentNumber: { type: String, trim: true },
  applicationNumber: { type: String, trim: true },
  filingDate: { type: String, trim: true },
  publishedDate: { type: String, trim: true },
  office: { type: String, trim: true },
  abstract: { type: String, trim: true },
  documentUrl: { type: String, default: null },
  images: [{ id: String, url: String, name: String }],
  externalLink: { type: String, trim: true },
  status: { type: String, enum: ['Draft','Published','Granted'], default: 'Draft' },
}, { timestamps: true });

module.exports = mongoose.model('Patent', patentSchema);
