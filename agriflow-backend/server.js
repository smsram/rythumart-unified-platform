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
const addressRoutes = require('./routes/address');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const ratingRoutes = require('./routes/ratings');
const { updateMarketPrices } = require('./services/marketService');
const marketRoutes = require('./routes/market');
const assistantRoutes = require('./routes/assistant');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/assistant', assistantRoutes);

app.get('/', (req, res) => {
  res.send('AgriFlow Backend is Running 🚀');
});

app.get('/api/admin/refresh-prices', async (req, res) => {
  await updateMarketPrices();
  res.json({ message: "Market prices refresh triggered" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});