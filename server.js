const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

dotenv.config();
connectDB();

const app = express();

// Set CORS for frontend URL / allow single-node deploy
app.use(cors({
  origin: ['http://localhost:3000', 'https://e-commerce-seven-delta-81.vercel.app', process.env.FRONTEND_URL],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// const allowedOrigins = [
//   'http://localhost:3000',
//   ...(process.env.FRONTEND_URLS || "")
//     .split(",")
//     .map((origin) => origin.trim())
//     .filter(Boolean),
// ];

// app.use(cors({
//     origin: function (origin, callback) {
//         // Allow requests with no origin (like mobile apps, curl requests, or Postman)
//         if (!origin) return callback(null, true);
        
//         if (allowedOrigins.indexOf(origin) !== -1) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true // Allow cookies/headers if needed
// }));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Serve frontend in production (only if a build exists)
const possibleBuildPaths = [
  process.env.FRONTEND_BUILD_PATH,
  path.join(__dirname, '../frontend/build'),
  path.join('/var', 'frontend', 'build')
].filter(Boolean);

const frontendBuildPath = possibleBuildPaths.find(p => fs.existsSync(p));

if (process.env.NODE_ENV === 'production' && frontendBuildPath) {
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  if (process.env.NODE_ENV === 'production' && !frontendBuildPath) {
    console.warn('Frontend build not found. Skipping static file serving. Checked:', possibleBuildPaths);
  }

  app.get('/', (req, res) => {
    res.send('ShopNest API is running in Development mode...');
  });
}

const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


module.exports = app;