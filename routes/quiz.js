// ===================================
// Quiz Routes
// ===================================

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { verifyToken, isAdmin, optionalAuth } = require('../middleware/auth');

// ===================================
// GET /api/quiz
// Get all quizzes (public)
// ===================================
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { category, limit = 50 } = req.query;
        
        let query = supabase
            .from('quizzes')
            .select('*, questions(*)')
            .eq('published', true)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (category) {
            query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        res.json({
            quizzes: data,
            count: data.length
        });
        
    } catch (error) {
        console.error('Get quizzes error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Quizze'
        });
    }
});

// ===================================
// GET /api/quiz/:id
// Get single quiz
// ===================================
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*, questions(*)')
            .eq('id', req.params.id)
            .single();
        
        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({
                error: 'Quiz nicht gefunden'
            });
        }
        
        res.json({ quiz: data });
        
    } catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen des Quiz'
        });
    }
});

// ===================================
// POST /api/quiz
// Create new quiz (Admin only)
// ===================================
router.post('/', [verifyToken, isAdmin], [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('category').isIn(['enkeltrick', 'polizei', 'bank', 'techsupport', 'gewinnspiel', 'allgemein']),
    body('questions').isArray({ min: 1 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { title, description, category, questions, published = false } = req.body;
        
        // Create quiz
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .insert([{
                title,
                description,
                category,
                published,
                created_by: req.user.id,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (quizError) throw quizError;
        
        // Create questions
        const questionsWithQuizId = questions.map(q => ({
            quiz_id: quiz.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            scenario: q.scenario || null
        }));
        
        const { error: questionsError } = await supabase
            .from('questions')
            .insert(questionsWithQuizId);
        
        if (questionsError) throw questionsError;
        
        res.status(201).json({
            message: 'Quiz erstellt',
            quiz: quiz
        });
        
    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({
            error: 'Fehler beim Erstellen des Quiz'
        });
    }
});

// ===================================
// PUT /api/quiz/:id
// Update quiz (Admin only)
// ===================================
router.put('/:id', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { title, description, category, published } = req.body;
        
        const { data, error } = await supabase
            .from('quizzes')
            .update({
                title,
                description,
                category,
                published,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            message: 'Quiz aktualisiert',
            quiz: data
        });
        
    } catch (error) {
        console.error('Update quiz error:', error);
        res.status(500).json({
            error: 'Fehler beim Aktualisieren des Quiz'
        });
    }
});

// ===================================
// DELETE /api/quiz/:id
// Delete quiz (Admin only)
// ===================================
router.delete('/:id', [verifyToken, isAdmin], async (req, res) => {
    try {
        // Delete questions first (cascade)
        await supabase
            .from('questions')
            .delete()
            .eq('quiz_id', req.params.id);
        
        // Delete quiz
        const { error } = await supabase
            .from('quizzes')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        
        res.json({
            message: 'Quiz gelöscht'
        });
        
    } catch (error) {
        console.error('Delete quiz error:', error);
        res.status(500).json({
            error: 'Fehler beim Löschen des Quiz'
        });
    }
});

// ===================================
// POST /api/quiz/:id/result
// Submit quiz result
// ===================================
router.post('/:id/result', verifyToken, [
    body('score').isInt({ min: 0 }),
    body('total').isInt({ min: 1 }),
    body('answers').isArray()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { score, total, answers } = req.body;
        
        const { data, error } = await supabase
            .from('quiz_results')
            .insert([{
                quiz_id: req.params.id,
                user_id: req.user.id,
                score,
                total,
                percentage: Math.round((score / total) * 100),
                answers: JSON.stringify(answers),
                completed_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json({
            message: 'Ergebnis gespeichert',
            result: data
        });
        
    } catch (error) {
        console.error('Submit result error:', error);
        res.status(500).json({
            error: 'Fehler beim Speichern des Ergebnisses'
        });
    }
});

// ===================================
// GET /api/quiz/:id/results
// Get quiz results (Admin only)
// ===================================
router.get('/:id/results', [verifyToken, isAdmin], async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quiz_results')
            .select('*, users(name, email)')
            .eq('quiz_id', req.params.id)
            .order('completed_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({
            results: data
        });
        
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Ergebnisse'
        });
    }
});

module.exports = router;
