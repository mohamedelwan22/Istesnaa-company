import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
    const { count, error } = await supabase
        .from('factories')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('Total factories in DB:', count);

    // Fetch all batch_names but limit because of potential memory issues if truly massive, 
    // but 4k is fine. However, Supabase select is limited to 1000 by default!
    
    let allBatches = [];
    let from = 0;
    let to = 999;
    let hasMore = true;

    while (hasMore) {
        const { data, error: fetchError } = await supabase
            .from('factories')
            .select('batch_name')
            .range(from, to);
        
        if (fetchError) break;
        if (data && data.length > 0) {
            allBatches = [...allBatches, ...data];
            from += 1000;
            to += 1000;
        } else {
            hasMore = false;
        }
    }

    const batchSummary = {};
    allBatches.forEach(b => {
        const name = b.batch_name || 'No Batch Name (Legacy)';
        batchSummary[name] = (batchSummary[name] || 0) + 1;
    });

    console.log('Batch breakdown:', batchSummary);
}

checkCounts();
