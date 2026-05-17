const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema({
  subtype: { type: String, enum: ['Placement','Internship','Training'], default: 'Placement' },
  department: { type: String, trim: true },

  // Placement & Internship fields
  studentName: { type: String, trim: true },
  rollNumber: { type: String, trim: true },
  companyName: { type: String, trim: true },
  package: { type: String, trim: true },
  role: { type: String, trim: true },
  placementType: { type: String, enum: ['On Campus','Off Campus'], default: 'On Campus' },
  offerLetterUrl: { type: String, default: null },
  studentPhotoUrl: { type: String, default: null },
  year: { type: String, trim: true },

  // Training Program fields
  programTitle: { type: String, trim: true },
  trainingType: { type: String, trim: true },
  conductedBy: { type: String, trim: true },
  startDate: { type: String, trim: true },
  endDate: { type: String, trim: true },
  numberOfStudents: { type: Number },
  description: { type: String, trim: true },
  certificateUrl: { type: String, default: null },
  galleryImages: [{ id: String, url: String, name: String }],

  status: { type: String, enum: ['Draft','Published'], default: 'Draft' },
}, { timestamps: true });

module.exports = mongoose.model('Placement', placementSchema);
