require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/faculty',       require('./routes/faculty'));
app.use('/api/profile',       require('./routes/profile'));
app.use('/api/submissions',   require('./routes/submissions'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/trending',      require('./routes/trending'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/achievements',  require('./routes/achievements'));
app.use('/api/patents',       require('./routes/patents'));
app.use('/api/publications',  require('./routes/publications'));
app.use('/api/placements',    require('./routes/placements'));
app.use('/api/projects',      require('./routes/projects'));
app.use('/api/subjects',      require('./routes/subjects'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Atlas connected — mits_cms');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
