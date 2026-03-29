// ===================================
// Auth Routes
// ===================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

// ===================================
// POST /api/auth/register
// Register new user
// ===================================
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { email, password, name } = req.body;
        
        // Check if user exists
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        
        if (existing) {
            return res.status(400).json({
                error: 'E-Mail bereits registriert'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const { data: user, error } = await supabase
            .from('users')
            .insert([{
                email,
                password: hashedPassword,
                name,
                role: 'user',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.status(201).json({
            message: 'Registrierung erfolgreich',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            error: 'Fehler bei der Registrierung'
        });
    }
});

// ===================================
// POST /api/auth/login
// Login user
// ===================================
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { email, password } = req.body;
        
        // Get user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error || !user) {
            return res.status(401).json({
                error: 'Ungültige Anmeldedaten'
            });
        }
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({
                error: 'Ungültige Anmeldedaten'
            });
        }
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.json({
            message: 'Login erfolgreich',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Fehler beim Login'
        });
    }
});

// ===================================
// GET /api/auth/me
// Get current user
// ===================================
router.get('/me', verifyToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, role, created_at')
            .eq('id', req.user.id)
            .single();
        
        if (error) throw error;
        
        res.json({ user });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Benutzerdaten'
        });
    }
});

module.exports = router;
