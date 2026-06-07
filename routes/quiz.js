const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const supabase = req.app.get('supabase'); 
        
        const { data, error } = await supabase
            .from('quizzes')
            .select(`
                id, title, description, category, published,
                questions (id, question, options, correct_answer, explanation, scenario)
            `);

        if (error) throw error;
        return res.status(200).json({ quizzes: data });
    } catch (err) {
        console.error('❌ Fehler beim Laden der Quizzes:', err.message);
        return res.status(500).json({ error: 'Fehler beim Laden للـ Quizze' });
    }
});

// ==========================================
// Quiz - Erstellen & Speichern
// ==========================================
router.post('/', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');
        const { title, description, category, published, questions } = req.body;

        const { data: newQuiz, error: quizError } = await supabase
            .from('quizzes')
            .insert([{ title, description, category, published: published || false }])
            .select()
            .single();

        if (quizError) throw quizError;

        if (questions && questions.length > 0) {
            const formattedQuestions = questions.map(q => ({
                quiz_id: newQuiz.id,
                question: q.question,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                scenario: q.scenario || null
            }));

            const { error: qError } = await supabase
                .from('questions')
                .insert(formattedQuestions);

            if (qError) throw qError;
        }

        return res.status(201).json({ message: 'Quiz erfolgreich erstellt!', quiz: newQuiz });
    } catch (err) {
        console.error('❌ Fehler beim Erstellen:', err.message);
        return res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');
        const { title, description, category, published, questions } = req.body;
        const quizId = req.params.id;

        const { error: quizError } = await supabase
            .from('quizzes')
            .update({ title, description, category, published })
            .eq('id', quizId);

        if (quizError) throw quizError;

        if (questions) {
            await supabase.from('questions').delete().eq('quiz_id', quizId);

            if (questions.length > 0) {
                const formattedQuestions = questions.map(q => ({
                    quiz_id: quizId,
                    question: q.question,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation,
                    scenario: q.scenario || null
                }));
                const { error: qError } = await supabase.from('questions').insert(formattedQuestions);
                if (qError) throw qError;
            }
        }

        return res.status(200).json({ message: 'Quiz erfolgreich aktualisiert!' });
    } catch (err) {
        console.error('❌ Fehler beim Aktualisieren:', err.message);
        return res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');
        const quizId = req.params.id;

        const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
        if (error) throw error;

        return res.status(200).json({ message: 'Quiz erfolgreich gelöscht!' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
