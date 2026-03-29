// ===================================
// Reports Routes
// ===================================

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { verifyToken, isAdmin, optionalAuth } = require('../middleware/auth');

// ===================================
// POST /api/reports
// Submit fraud report (public)
// ===================================
router.post('/', [
    body('phone').trim().notEmpty(),
    body('category').isIn(['enkeltrick', 'polizei', 'schock', 'bank', 'techsupport', 'gewinnspiel', 'sonstiges'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { phone, category, details = '' } = req.body;
        
        // Insert report
        const { data: report, error } = await supabase
            .from('reports')
            .insert([{
                phone,
                category,
                details,
                reported_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // Update or create number in numbers table
        const { data: existingNumber } = await supabase
            .from('numbers')
            .select('*')
            .eq('phone', phone)
            .single();
        
        if (existingNumber) {
            // Update
            const newCount = (existingNumber.reports_count || 1) + 1;
            await supabase
                .from('numbers')
                .update({
                    reports_count: newCount,
                    status: newCount >= 5 ? 'danger' : 'warning',
                    category: category,
                    updated_at: new Date().toISOString()
                })
                .eq('phone', phone);
        } else {
            // Insert
            await supabase
                .from('numbers')
                .insert([{
                    phone,
                    status: 'warning',
                    category,
                    reports_count: 1,
                    updated_at: new Date().toISOString()
                }]);
        }
        
        res.status(201).json({
            message: 'Meldung erfolgreich gespeichert',
            report: report
        });
        
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({
            error: 'Fehler beim Speichern der Meldung'
        });
    }
});

// ===================================
// GET /api/reports
// Get all reports (Admin only)
// ===================================
router.get('/', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { limit = 50, category } = req.query;
        
        let query = supabase
            .from('reports')
            .select('*')
            .order('reported_at', { ascending: false })
            .limit(limit);
        
        if (category) {
            query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        res.json({
            reports: data,
            count: data.length
        });
        
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Meldungen'
        });
    }
});

// ===================================
// GET /api/reports/stats
// Get reports statistics (Admin only)
// ===================================
router.get('/stats', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { data: reports } = await supabase
            .from('reports')
            .select('category');
        
        const stats = {
            total: reports?.length || 0,
            byCategory: {}
        };
        
        reports?.forEach(r => {
            stats.byCategory[r.category] = (stats.byCategory[r.category] || 0) + 1;
        });
        
        res.json({ stats });
        
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Statistiken'
        });
    }
});

// ===================================
// DELETE /api/reports/:id
// Delete report (Admin only)
// ===================================
router.delete('/:id', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        
        res.json({
            message: 'Meldung gelöscht'
        });
        
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({
            error: 'Fehler beim Löschen der Meldung'
        });
    }
});

module.exports = router;
