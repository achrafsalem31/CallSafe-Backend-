// ===================================
// routes/training.js  
// ===================================

const express = require('express');
const router = express.Router();

// ==========================================
// GET /api/training  — alle Module laden
// ==========================================
router.get('/', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');
        const { data, error } = await supabase
            .from('training_modules')
            .select('id, title, description, content, category, icon, published, order_index, created_at')
            .order('order_index', { ascending: true });
        if (error) throw error;
        return res.status(200).json({ modules: data });
    } catch (err) {
        console.error('❌ Fehler beim Laden der Trainings:', err.message);
        return res.status(500).json({ error: 'Fehler beim Laden der Trainings' });
    }
});

// ==========================================
// GET /api/training/:id  — einzelnes Modul
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');
        const { data, error } = await supabase
            .from('training_modules')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Modul nicht gefunden' });
        return res.status(200).json({ module: data });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ==========================================
// POST /api/training  — neues Modul erstellen
// ==========================================
router.post('/', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');
        const { title, description, content, category, icon, published, order_index } = req.body;

        if (!title || !description || !content || !category) {
            return res.status(400).json({ error: 'Titel, Beschreibung, Inhalt und Kategorie sind Pflichtfelder' });
        }

        const { data: newModule, error } = await supabase
            .from('training_modules')
            .insert([{
                title,
                description,
                content,
                category,
                icon: icon || '📚',
                published: published ?? true,
                order_index: order_index ?? 0,
            }])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Neues Training-Modul erstellt: "${title}" [${category}]`);
        return res.status(201).json({ message: 'Training-Modul erfolgreich erstellt!', module: newModule });
    } catch (err) {
        console.error('❌ Fehler beim Erstellen:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// ==========================================
// PUT /api/training/:id  — Modul bearbeiten
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');
        const { title, description, content, category, icon, published, order_index } = req.body;

        const { error } = await supabase
            .from('training_modules')
            .update({ title, description, content, category, icon, published, order_index, updated_at: new Date().toISOString() })
            .eq('id', req.params.id);

        if (error) throw error;

        console.log(`✅ Training-Modul aktualisiert: ID ${req.params.id}`);
        return res.status(200).json({ message: 'Training-Modul erfolgreich aktualisiert!' });
    } catch (err) {
        console.error('❌ Fehler beim Aktualisieren:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// ==========================================
// DELETE /api/training/:id  — Modul löschen
// ==========================================
router.delete('/:id', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');
        const { error } = await supabase
            .from('training_modules')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        console.log(`🗑️ Training-Modul gelöscht: ID ${req.params.id}`);
        return res.status(200).json({ message: 'Training-Modul erfolgreich gelöscht!' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;