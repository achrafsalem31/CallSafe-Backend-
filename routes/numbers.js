// ===================================
// Numbers Routes
// ===================================

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { verifyToken, isAdmin, optionalAuth } = require('../middleware/auth');

// ===================================
// GET /api/numbers/check/:phone
// Check if phone number is reported
// ===================================
router.get('/check/:phone', async (req, res) => {
    try {
        const phone = decodeURIComponent(req.params.phone);
        
        const { data, error } = await supabase
            .from('numbers')
            .select('*')
            .eq('phone', phone)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        if (!data) {
            return res.json({
                found: false,
                status: 'safe',
                message: 'Diese Nummer wurde noch nicht gemeldet'
            });
        }
        
        const categoryNames = {
            enkeltrick: 'Enkeltrick',
            polizei: 'Falsche Polizisten',
            schock: 'Schockanruf',
            bank: 'Bank-Betrug',
            techsupport: 'Tech-Support',
            gewinnspiel: 'Gewinnspiel',
            sonstiges: 'Sonstiges'
        };
        
        res.json({
            found: true,
            status: data.status,
            data: {
                phone: data.phone,
                category: categoryNames[data.category] || data.category,
                reports_count: data.reports_count,
                updated_at: data.updated_at
            },
            message: `Diese Nummer wurde ${data.reports_count}x gemeldet`
        });
        
    } catch (error) {
        console.error('Check number error:', error);
        res.status(500).json({
            error: 'Fehler beim Prüfen der Nummer'
        });
    }
});

// ===================================
// GET /api/numbers
// Get all reported numbers (Admin only)
// ===================================
router.get('/', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { limit = 100, status } = req.query;
        
        let query = supabase
            .from('numbers')
            .select('*')
            .order('reports_count', { ascending: false })
            .limit(limit);
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        res.json({
            numbers: data,
            count: data.length
        });
        
    } catch (error) {
        console.error('Get numbers error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Nummern'
        });
    }
});

// ===================================
// GET /api/numbers/stats
// Get numbers statistics
// ===================================
router.get('/stats', optionalAuth, async (req, res) => {
    try {
        const { data } = await supabase
            .from('numbers')
            .select('*');
        
        const stats = {
            totalNumbers: data?.length || 0,
            totalReports: data?.reduce((sum, n) => sum + (n.reports_count || 1), 0) || 0,
            byCategory: {},
            byStatus: {
                safe: 0,
                warning: 0,
                danger: 0
            }
        };
        
        data?.forEach(n => {
            const cat = n.category || 'sonstiges';
            stats.byCategory[cat] = (stats.byCategory[cat] || 0) + (n.reports_count || 1);
            stats.byStatus[n.status] = (stats.byStatus[n.status] || 0) + 1;
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
// DELETE /api/numbers/:phone
// Delete number (Admin only)
// ===================================
router.delete('/:phone', [verifyToken, isAdmin], async (req, res) => {
    try {
        const phone = decodeURIComponent(req.params.phone);
        
        const { error } = await supabase
            .from('numbers')
            .delete()
            .eq('phone', phone);
        
        if (error) throw error;
        
        res.json({
            message: 'Nummer gelöscht'
        });
        
    } catch (error) {
        console.error('Delete number error:', error);
        res.status(500).json({
            error: 'Fehler beim Löschen der Nummer'
        });
    }
});

module.exports = router;
