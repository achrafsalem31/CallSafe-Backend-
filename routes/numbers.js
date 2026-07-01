// routes/numbers.js

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { verifyToken, isAdmin, optionalAuth } = require('../middleware/auth');

// Telefonnummer normalisieren —

function normalizePhone(rawPhone) {
    let phone = String(rawPhone).replace(/[^\d+]/g, '');

    if (phone.startsWith('0049')) {
        phone = '+49' + phone.slice(4);
    } else if (phone.startsWith('0') && !phone.startsWith('00')) {
        phone = '+49' + phone.slice(1);
    }

    return phone;
}

// GET /api/numbers/check/:phone
router.get('/check/:phone', async (req, res) => {
    try {
        let phone = decodeURIComponent(req.params.phone || '');
        phone = normalizePhone(phone);

        if (!phone) {
            return res.status(400).json({ error: 'Ungültige Telefonnummer' });
        }

        
        const { data: safeEntry, error: safeError } = await supabase
            .from('safe_numbers')
            .select('*')
            .eq('Nummer', phone)
            .maybeSingle();

        if (safeError) throw safeError;

        if (safeEntry) {
            return res.json({
                found: true,
                whitelisted: true,
                status: 'safe',
                data: {
                    phone: safeEntry.Nummer,
                    name: safeEntry.Name,
                    category: safeEntry.Kategorie,
                    city: safeEntry.Stadt,
                    description: safeEntry.Beschreibung
                },
                message: `Vertrauenswürdige Nummer: ${safeEntry.Name}`
            });
        }

        // Blacklist prüfen (numbers)

        const { data: blacklistEntry, error: blacklistError } = await supabase
            .from('numbers')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();

        if (blacklistError) throw blacklistError;

        if (blacklistEntry) {
            const categoryNames = {
                enkeltrick: 'Enkeltrick',
                polizei: 'Falsche Polizisten',
                schock: 'Schockanruf',
                bank: 'Bank-Betrug',
                techsupport: 'Tech-Support',
                gewinnspiel: 'Gewinnspiel',
                sonstiges: 'Sonstiges'
            };

            return res.json({
                found: true,
                whitelisted: false,
                status: blacklistEntry.status,
                data: {
                    phone: blacklistEntry.phone,
                    category: categoryNames[blacklistEntry.category] || blacklistEntry.category,
                    reports_count: blacklistEntry.reports_count,
                    updated_at: blacklistEntry.updated_at
                },
                message: `Diese Nummer wurde ${blacklistEntry.reports_count}x gemeldet`
            });
        }

        // Nummer unbekannt
        return res.json({
            found: false,
            whitelisted: false,
            status: 'warning',
            message: 'Diese Nummer ist uns noch nicht bekannt'
        });

    } catch (error) {
        console.error('Check number error:', error);
        res.status(500).json({
            error: 'Fehler beim Prüfen der Nummer'
        });
    }
});


router.get('/', async (req, res) => {
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



router.get('/safe', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { limit = 500, category } = req.query;

        let query = supabase
            .from('safe_numbers')
            .select('*')
            .order('Name', { ascending: true })
            .limit(limit);

        if (category) {
            query = query.eq('Kategorie', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ safeNumbers: data, count: data.length });

    } catch (error) {
        console.error('Get safe numbers error:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Whitelist' });
    }
});



router.post('/safe', [verifyToken, isAdmin], async (req, res) => {
    try {
        let { name, phone, category, city, description } = req.body;

        if (!name || !phone || !category) {
            return res.status(400).json({ error: 'Name, Telefonnummer und Kategorie sind Pflichtfelder' });
        }

        if (!['Polizei', 'Banken', 'Behörden', 'Unternehmen'].includes(category)) {
            return res.status(400).json({ error: 'Kategorie muss Polizei, Banken, Behörden oder Unternehmen sein' });
        }

        phone = normalizePhone(phone);

        const { data, error } = await supabase
            .from('safe_numbers')
            .insert([{
                Name: name,
                Nummer: phone,
                Kategorie: category,
                Stadt: city,
                Beschreibung: description
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: 'Whitelist-Eintrag erstellt', safeNumber: data });

    } catch (error) {
        console.error('Create safe number error:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen des Whitelist-Eintrags' });
    }
});



router.delete('/safe/:phone', [verifyToken, isAdmin], async (req, res) => {
    try {
        let phone = decodeURIComponent(req.params.phone);
        phone = normalizePhone(phone);

        const { error } = await supabase
            .from('safe_numbers')
            .delete()
            .eq('Nummer', phone);

        if (error) throw error;

        res.json({ message: 'Whitelist-Eintrag gelöscht' });

    } catch (error) {
        console.error('Delete safe number error:', error);
        res.status(500).json({ error: 'Fehler beim Löschen des Whitelist-Eintrags' });
    }
});


router.delete('/:phone', [verifyToken, isAdmin], async (req, res) => {
    try {
        let phone = decodeURIComponent(req.params.phone);
        phone = normalizePhone(phone);

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