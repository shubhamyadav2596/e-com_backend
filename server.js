const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

// Set CORS for frontend URL / allow single-node deploy
// app.use(cors({
//   origin: ['http://localhost:3000', 'https://shopnest-liart.vercel.app', process.env.FRONTEND_URL],
//   credentials: true
// }));

const allowedOrigins = [
  'http://localhost:5173', 'https://shopnest-liart.vercel.app',
  ...(process.env.FRONTEND_URLS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests, or Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Allow cookies/headers if needed
}));

app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Serve frontend in production only when the build exists
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.resolve(__dirname, '../frontend/build');
  const frontendIndexPath = path.join(frontendBuildPath, 'index.html');

  if (fs.existsSync(frontendIndexPath)) {
    app.use(express.static(frontendBuildPath));
    app.use((req, res) => {
      res.sendFile(frontendIndexPath);
    });
  } else {
    app.use((req, res) => {
      res.status(404).json({ message: 'Frontend build not available for this deployment.' });
    });
  }
} else {
  app.get('/', (req, res) => {
    res.send('ShopNest API is running in Development mode...');
  });
}

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
