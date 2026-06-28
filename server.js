const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

// Set CORS for frontend URL / allow single-node deploy
app.use(cors({
  origin: ['http://localhost:3000', 'https://e-commerce-seven-delta-81.vercel.app', process.env.FRONTEND_URL],
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Serve frontend in production when the build exists
const frontendBuildPaths = [
  path.join(__dirname, '../frontend/build'),
  path.join(__dirname, 'frontend/build'),
  path.join(__dirname, 'build')
];
const frontendBuildPath = frontendBuildPaths.find((buildPath) => fs.existsSync(buildPath));

if (process.env.NODE_ENV === 'production' && frontendBuildPath) {
  app.use(express.static(frontendBuildPath));

  app.use((req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('ShopNest API is running...');
  });
}

module.exports = app;
