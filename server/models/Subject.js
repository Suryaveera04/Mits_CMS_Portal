const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  regulation: { type: String, trim: true },
  semester: { type: String, trim: true },
  credits: { type: String, trim: true },
  faculty: { type: String, trim: true },
  syllabusUrl: { type: String, default: null },
  lectureNotesUrl: { type: String, default: null },
  labManualUrl: { type: String, default: null },
  questionBankUrl: { type: String, default: null },
  resources: [{ type: String }],
  department: { type: String, trim: true },
  status: { type: String, enum: ['Draft','Published'], default: 'Draft' },
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
