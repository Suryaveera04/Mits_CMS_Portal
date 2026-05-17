const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const users = [
  { id: '1', name: 'Surya', email: 'surya@mits.edu', password: 'Surya@123', role: 'FACULTY', department: 'AIML', designation: 'Assistant Professor', avatar: null },
  { id: '2', name: 'Raghu', email: 'raghu@mits.edu', password: 'Surya@123', role: 'FACULTY', department: 'AIML', designation: 'Assistant Professor', avatar: null },
  { id: '3', name: 'Padma', email: 'padma@mits.edu', password: 'Surya@123', role: 'HOD', department: 'AIML', designation: 'Professor & HOD', avatar: null },
];

app.get('/api/health', (req, res) => res.json({ status: 'ok', mock: true }));

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase().trim());
  if (!user || user.password !== password) return res.status(401).json({ error: 'Invalid email or password' });
  const { id, name, role, department, designation, avatar } = user;
  return res.json({ id, name, email: user.email, role, department, designation, avatar });
});

// Minimal stubs for other APIs used by frontend (return empty lists or simple objects)
app.get('/api/faculty', (req, res) => res.json([]));
app.get('/api/profile/:id', (req, res) => res.json({}));
app.get('/api/submissions', (req, res) => res.json([]));
app.get('/api/events', (req, res) => res.json([]));
app.get('/api/trending', (req, res) => res.json([]));
app.get('/api/notifications', (req, res) => res.json([]));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Mock server listening on http://localhost:${port} (no DB)`));
