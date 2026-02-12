const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth'); // <--- NEW IMPORT
const cropRoutes = require('./routes/crops');
const aiRoutes = require('./routes/ai');
const uploadRoutes = require('./routes/upload');
const requestRoutes = require('./routes/requests');
const profileRoutes = require('./routes/profile');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
  res.send('AgriFlow Backend is Running 🚀');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});