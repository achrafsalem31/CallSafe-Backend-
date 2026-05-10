const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

// ===================================
// POST /api/auth/register
// ===================================
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { email, password, name } = req.body;
        
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
        if (existing) return res.status(400).json({ error: 'E-Mail bereits registriert' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: user, error } = await supabase.from('users').insert([{
            email, password: hashedPassword, name, role: 'user', created_at: new Date().toISOString()
        }]).select().single();

        if (error) throw error;

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ message: 'Registrierung erfolgreich', token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Fehler bei der Registrierung' });
    }
});

// ===================================
// POST /api/auth/login
// ===================================
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { email, password } = req.body;
        console.log("------------------------------------");
        console.log("➡️ Login-Versuch für:", email);

        // جلب المستخدم من قاعدة البيانات
        const { data: dbUser, error } = await supabase.from('users').select('*').eq('email', email).single();

        if (error || !dbUser) {
            console.log("❌ هاد الإيميل ما كاينش في قاعدة البيانات");
            return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
        }

        // التحقق من الباسورد بـ Bcrypt
        const validPassword = await bcrypt.compare(password, dbUser.password);
        console.log("📥 الباسورد اللي دخلتي:", password);
        console.log("⚖️ واش كاين تطابق؟", validPassword);

        if (!validPassword) {
            console.log("❌ الباسورد غلط");
            return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
        }

        // إنشاء الـ Token
        const token = jwt.sign(
            { id: dbUser.id, email: dbUser.email, role: dbUser.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        console.log("✅ Login erfolgreich!");
        console.log("------------------------------------");

        res.json({
            message: 'Login erfolgreich',
            token,
            user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role }
        });
    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({ error: 'Fehler beim Login' });
    }
});

// ===================================
// GET /api/auth/me
// ===================================
router.get('/me', verifyToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase.from('users').select('id, email, name, role, created_at').eq('id', req.user.id).single();
        if (error) throw error;
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Benutzerdaten' });
    }
});
// Logout Route
router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Erfolgreich abgemeldet' });
});
module.exports = router;