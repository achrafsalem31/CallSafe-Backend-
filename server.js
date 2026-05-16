// ===================================
// SECUREME Backend Server
// ===================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 1️⃣ شحن الـ .env بالمسار المضمون ديريكت
require('dotenv').config();
const app = express();

// 2️⃣ إنشاء وتثبيت Supabase فـ الـ app (خاصو يكون هنايا قبل الـ Routes!)
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);app.set('supabase', supabase);

console.log('✅ Supabase Client initialisiert und an app gebunden');

// CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));

// 3️⃣ عاد هنا كيجيو الـ Import Routes دياولك مورا ما تسبت سوبابيس
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const trainingRoutes = require('./routes/training');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const numbersRoutes = require('./routes/numbers');
const contactRoutes = require('./routes/contact');

const PORT = process.env.PORT || 3000;

// ===================================
// Middleware
// ===================================

// Security Headers
app.use(helmet());

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
app.use('/api/contact', contactRoutes);

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