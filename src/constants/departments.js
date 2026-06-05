// src/constants/departments.js
// Matches the departments table in the database exactly

export const DEPARTMENTS = [
  { code: 'AIML',  name: 'Computer Science & Engineering (AIML)' },
  { code: 'AI',    name: 'Computer Science & Engineering (AI)' },
  { code: 'CSE',   name: 'Computer Science & Engineering' },
  { code: 'DS',    name: 'Computer Science & Engineering (Data Science)' },
  { code: 'CS',    name: 'Computer Science & Engineering (Cyber Security)' },
  { code: 'CIVIL', name: 'Civil Engineering' },
  { code: 'EEE',   name: 'Electrical & Electronics Engineering' },
  { code: 'ECE',   name: 'Electronics & Communication Engineering' },
  { code: 'MECH',  name: 'Mechanical Engineering' },
];

export const DEPARTMENT_CODES = DEPARTMENTS.map(d => d.code);
