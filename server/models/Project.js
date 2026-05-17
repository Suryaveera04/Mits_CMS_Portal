const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  teamMembers: { type: String, trim: true },
  guide: { type: String, trim: true },
  academicYear: { type: String, trim: true },
  stack: { type: String, trim: true },
  abstract: { type: String, trim: true },
  github: { type: String, trim: true },
  demo: { type: String, trim: true },
  reportUrl: { type: String, default: null },
  images: [{ id: String, url: String, name: String }],
  status: { type: String, enum: ['Draft','Published'], default: 'Draft' },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
