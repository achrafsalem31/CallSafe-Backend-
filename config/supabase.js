// ===================================
// Supabase Configuration
// ===================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL und ANON_KEY müssen in .env gesetzt sein!');
}

// Client für normale Operationen (mit RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin Client für privilegierte Operationen (ohne RLS)
const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

console.log('✅ Supabase Client initialisiert');
console.log('📊 URL:', supabaseUrl);

module.exports = {
    supabase,
    supabaseAdmin
};
