const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  achievementType: { type: String, trim: true },
  name: { type: String, trim: true },
  department: { type: String, trim: true },
  date: { type: String, trim: true },
  shortDescription: { type: String, trim: true },
  pdfUrl: { type: String, default: null },
  thumbnail: { id: String, url: String, name: String },
  externalLink: { type: String, trim: true },
  status: { type: String, enum: ['Draft','Published','Approved'], default: 'Draft' },
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema);
