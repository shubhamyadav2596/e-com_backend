const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Set CORS for frontend URL / allow single-node deploy
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://e-commerce-seven-delta-81.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
