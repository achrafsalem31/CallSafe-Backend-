// ===================================
// Users Routes
// ===================================

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ===================================
// GET /api/users
// Get all users (Admin only)
// ===================================
router.get('/', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, created_at')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({
            users: data,
            count: data.length
        });
        
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Benutzer'
        });
    }
});

// ===================================
// GET /api/users/:id
// Get single user (Admin only)
// ===================================
router.get('/:id', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, created_at')
            .eq('id', req.params.id)
            .single();
        
        if (error) throw error;
        
        res.json({ user: data });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen des Benutzers'
        });
    }
});

// ===================================
// GET /api/users/:id/results
// Get user's quiz results (Admin only)
// ===================================
router.get('/:id/results', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quiz_results')
            .select('*, quizzes(title, category)')
            .eq('user_id', req.params.id)
            .order('completed_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({
            results: data
        });
        
    } catch (error) {
        console.error('Get user results error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Ergebnisse'
        });
    }
});

// ===================================
// PUT /api/users/:id/role
// Update user role (Admin only)
// ===================================
router.put('/:id/role', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                error: 'Ungültige Rolle'
            });
        }
        
        const { data, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', req.params.id)
            .select('id, email, name, role')
            .single();
        
        if (error) throw error;
        
        res.json({
            message: 'Rolle aktualisiert',
            user: data
        });
        
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            error: 'Fehler beim Aktualisieren der Rolle'
        });
    }
});

// ===================================
// DELETE /api/users/:id
// Delete user (Admin only)
// ===================================
router.delete('/:id', [verifyToken, isAdmin], async (req, res) => {
    try {
        // Prevent self-deletion
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                error: 'Sie können sich nicht selbst löschen'
            });
        }
        
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        
        res.json({
            message: 'Benutzer gelöscht'
        });
        
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            error: 'Fehler beim Löschen des Benutzers'
        });
    }
});

module.exports = router;
