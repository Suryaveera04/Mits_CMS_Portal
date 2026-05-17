require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Faculty = require('./models/Faculty');

const users = [
  {
    name: 'Surya',
    email: 'surya@mits.edu',
    password: 'Surya@123',
    role: 'FACULTY',
    department: 'AIML',
    designation: 'Assistant Professor',
  },
  {
    name: 'Raghu',
    email: 'raghu@mits.edu',
    password: 'Surya@123',
    role: 'FACULTY',
    department: 'AIML',
    designation: 'Assistant Professor',
  },
  {
    name: 'Padma',
    email: 'padma@mits.edu',
    password: 'Surya@123',
    role: 'HOD',
    department: 'AIML',
    designation: 'Professor & HOD',
  },
];

const Achievement = require('./models/Achievement');
const Patent = require('./models/Patent');
const Publication = require('./models/Publication');
const Placement = require('./models/Placement');
const Project = require('./models/Project');
const Subject = require('./models/Subject');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await Faculty.findOneAndUpdate(
      { email: u.email },
      { name: u.name, email: u.email, passwordHash, role: u.role, department: u.department, designation: u.designation },
      { upsert: true, new: true }
    );
    console.log(`✓ Seeded: ${u.name} (${u.role}) — ${u.email}`);
  }

  // Seed a few sample content entries if not present
  const achCount = await Achievement.countDocuments();
  if (!achCount) {
    await Achievement.create({ title: 'Best Project Award', achievementType: 'Award', name: 'Team Alpha', department: 'AIML', date: '2025-03-10', shortDescription: 'Won best project in national symposium', status: 'Published' });
    console.log('✓ Seeded sample Achievement');
  }

  const patCount = await Patent.countDocuments();
  if (!patCount) {
    await Patent.create({ title: 'Smart Sorting Device', patentType: 'Published', inventors: 'Dr. Padma; Surya', department: 'AIML', patentNumber: '', applicationNumber: 'APPL-2024-001', filingDate: '2024-09-01', status: 'Published' });
    console.log('✓ Seeded sample Patent');
  }

  const pubCount = await Publication.countDocuments();
  if (!pubCount) {
    await Publication.create({ title: 'Deep Learning for X', authors: 'Raghu, Surya', venue: 'International Conference on AI', year: '2024', indexing: 'Scopus', status: 'Published' });
    console.log('✓ Seeded sample Publication');
  }

  const plcCount = await Placement.countDocuments();
  if (!plcCount) {
    await Placement.create({
      subtype: 'Placement',
      department: 'AIML',
      studentName: 'Aditya Kumar',
      rollNumber: 'AIML2021001',
      companyName: 'TechCorp India',
      package: '6.5 LPA',
      role: 'Software Engineer',
      placementType: 'On Campus',
      year: '2024',
      status: 'Published'
    });
    await Placement.create({
      subtype: 'Internship',
      department: 'AIML',
      studentName: 'Bhavna Sharma',
      rollNumber: 'AIML2022005',
      companyName: 'DataMin Solutions',
      package: '15000/month',
      role: 'ML Intern',
      placementType: 'Off Campus',
      year: '2024',
      status: 'Published'
    });
    await Placement.create({
      subtype: 'Training',
      department: 'AIML',
      programTitle: 'Advanced AI & ML Bootcamp',
      trainingType: 'Workshop',
      conductedBy: 'Google Developers',
      startDate: '2024-05-01',
      endDate: '2024-05-15',
      numberOfStudents: 45,
      description: 'Intensive 2-week training on TensorFlow and advanced ML algorithms',
      status: 'Published'
    });
    console.log('✓ Seeded sample Placements/Internships/Training');
  }

  const projCount = await Project.countDocuments();
  if (!projCount) {
    await Project.create({ title: 'Autonomous Drone', teamMembers: 'Team Beta', guide: 'Dr. Padma', academicYear: '2023-24', stack: 'ROS, Python', status: 'Published' });
    console.log('✓ Seeded sample Project');
  }

  const subCount = await Subject.countDocuments();
  if (!subCount) {
    await Subject.create({ code: 'CS101', name: 'Introduction to Programming', regulation: '2023', semester: '1', credits: '3', faculty: 'Surya', department: 'AIML', status: 'Published' });
    console.log('✓ Seeded sample Subject');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => { console.error(err); process.exit(1); });
