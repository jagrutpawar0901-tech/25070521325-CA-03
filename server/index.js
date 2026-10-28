const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin '${origin}' not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts. Please wait 15 minutes.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static Files (Uploads) ───────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/family', require('./routes/family'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/admissions', require('./routes/admissions'));
app.use('/api/beds', require('./routes/beds'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/wards', require('./routes/wards'));
app.use('/api/emergencies', require('./routes/emergencies'));
app.use('/api/ambulances', require('./routes/ambulances'));
app.use('/api/medical-records', require('./routes/medicalRecords'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/laboratory', require('./routes/laboratory'));
app.use('/api/blood-bank', require('./routes/bloodBank'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/queues', require('./routes/queues'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/discharge-summaries', require('./routes/dischargeSummaries'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/departments', require('./routes/departments'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SwasthyaOS API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Database Connection and Server Start ─────────────────────────────────────
const PORT = process.env.PORT || 5000;
const { seedDatabase } = require('./utils/seed');

async function startServer() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/swasthyaos';
  const isProduction = process.env.NODE_ENV === 'production';

  let connected = false;

  // ── Primary: Try real MongoDB ──────────────────────────────────────────────
  try {
    console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//<credentials>@')}`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: isProduction ? 10000 : 4000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, avoids some DNS issues
    });
    console.log('✅ MongoDB connected successfully.');
    connected = true;

    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚡ Empty database detected — seeding initial data...');
      await seedDatabase();
    } else {
      console.log(`📦 Database ready. Found ${userCount} user account(s).`);
    }
  } catch (err) {
    if (isProduction) {
      // In production, never silently fall back — fail loudly
      console.error('❌ FATAL: Cannot connect to MongoDB in production:', err.message);
      console.error('   → Set MONGO_URI in your environment variables to a valid connection string.');
      console.error('   → Example: MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/swasthyaos');
      process.exit(1);
    }

    // ── Development Fallback: In-Memory MongoDB ──────────────────────────────
    console.warn('⚠️  Real MongoDB not reachable:', err.message);
    console.log('🔄 Switching to in-memory MongoDB (development/demo mode)...');
    console.log('   💡 To use persistent storage: ensure MongoDB is running locally,');
    console.log('      or set MONGO_URI=mongodb+srv://... in server/.env');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('✅ In-memory MongoDB ready. Note: data will reset on restart.');
      await seedDatabase(true);
      connected = true;
    } catch (memErr) {
      console.error('❌ In-memory MongoDB fallback also failed:', memErr.message);
    }
  }

  if (!connected) {
    console.error('❌ Server startup aborted — no database connection.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 SwasthyaOS API  → http://localhost:${PORT}`);
    console.log(`📍 Environment     → ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS origins    → ${allowedOrigins.join(', ')}`);
    console.log(`🔑 JWT secret set  → ${!!process.env.JWT_SECRET}\n`);
  });
}

startServer();

module.exports = app;
