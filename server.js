// ===================================
// SECUREME Backend Server
// ===================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const trainingRoutes = require('./routes/training');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const numbersRoutes = require('./routes/numbers');

const app = express();
const PORT = process.env.PORT || 3000;

// ===================================
// Middleware
// ===================================

// Security Headers
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 100 // Max 100 Requests pro IP
});
app.use('/api/', limiter);

// Request Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ===================================
// Routes
// ===================================

// Health Check
app.get('/', (req, res) => {
    res.json({
        message: 'SECUREME API Server',
        version: '1.0.0',
        status: 'running'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/numbers', numbersRoutes);

// ===================================
// Error Handling
// ===================================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route nicht gefunden',
        path: req.path
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.status || 500).json({
        error: err.message || 'Interner Serverfehler',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ===================================
// Server Start
// ===================================

app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🛡️  SECUREME Backend Server');
    console.log('═══════════════════════════════════════');
    console.log(`📡 Server läuft auf: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('📋 Verfügbare Endpunkte:');
    console.log('  POST   /api/auth/login');
    console.log('  POST   /api/auth/register');
    console.log('  GET    /api/quiz');
    console.log('  POST   /api/quiz');
    console.log('  GET    /api/training');
    console.log('  POST   /api/reports');
    console.log('  GET    /api/numbers');
    console.log('');
});

module.exports = app;
