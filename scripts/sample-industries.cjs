
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function sampleIndustries() {
    const { data, error } = await supabase
        .from('factories')
        .select('industry')
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    console.log('Sample industries:', JSON.stringify(data, null, 2));
}

sampleIndustries();
