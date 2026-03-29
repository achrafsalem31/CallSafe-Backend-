// ===================================
// Training/Schulung Routes
// ===================================

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { verifyToken, isAdmin, optionalAuth } = require('../middleware/auth');

// ===================================
// GET /api/training
// Get all training modules
// ===================================
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { category } = req.query;
        
        let query = supabase
            .from('training_modules')
            .select('*')
            .eq('published', true)
            .order('order_index', { ascending: true });
        
        if (category) {
            query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        res.json({
            modules: data,
            count: data.length
        });
        
    } catch (error) {
        console.error('Get training error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Trainingsmodule'
        });
    }
});

// ===================================
// GET /api/training/:id
// Get single training module
// ===================================
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('training_modules')
            .select('*')
            .eq('id', req.params.id)
            .single();
        
        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({
                error: 'Trainingsmodul nicht gefunden'
            });
        }
        
        res.json({ module: data });
        
    } catch (error) {
        console.error('Get training error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen des Trainingsmoduls'
        });
    }
});

// ===================================
// POST /api/training
// Create training module (Admin only)
// ===================================
router.post('/', [verifyToken, isAdmin], [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('content').trim().notEmpty(),
    body('category').isIn(['enkeltrick', 'polizei', 'schock', 'bank', 'techsupport', 'gewinnspiel'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { title, description, content, category, icon, published = false, order_index = 0 } = req.body;
        
        const { data, error } = await supabase
            .from('training_modules')
            .insert([{
                title,
                description,
                content,
                category,
                icon,
                published,
                order_index,
                created_by: req.user.id,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json({
            message: 'Trainingsmodul erstellt',
            module: data
        });
        
    } catch (error) {
        console.error('Create training error:', error);
        res.status(500).json({
            error: 'Fehler beim Erstellen des Trainingsmoduls'
        });
    }
});

// ===================================
// PUT /api/training/:id
// Update training module (Admin only)
// ===================================
router.put('/:id', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { title, description, content, category, icon, published, order_index } = req.body;
        
        const { data, error } = await supabase
            .from('training_modules')
            .update({
                title,
                description,
                content,
                category,
                icon,
                published,
                order_index,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            message: 'Trainingsmodul aktualisiert',
            module: data
        });
        
    } catch (error) {
        console.error('Update training error:', error);
        res.status(500).json({
            error: 'Fehler beim Aktualisieren des Trainingsmoduls'
        });
    }
});

// ===================================
// DELETE /api/training/:id
// Delete training module (Admin only)
// ===================================
router.delete('/:id', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { error } = await supabase
            .from('training_modules')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        
        res.json({
            message: 'Trainingsmodul gelöscht'
        });
        
    } catch (error) {
        console.error('Delete training error:', error);
        res.status(500).json({
            error: 'Fehler beim Löschen des Trainingsmoduls'
        });
    }
});

module.exports = router;
