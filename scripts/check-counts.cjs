const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCounts() {
    const { count, error } = await supabase
        .from('factories')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('Total factories in DB:', count);

    const { data: batches } = await supabase
        .from('factories')
        .select('batch_name')
        .order('created_at', { ascending: false });

    const batchSummary = {};
    batches.forEach(b => {
        const name = b.batch_name || 'No Name';
        batchSummary[name] = (batchSummary[name] || 0) + 1;
    });

    console.log('Batch breakdown:', batchSummary);
}

checkCounts();
