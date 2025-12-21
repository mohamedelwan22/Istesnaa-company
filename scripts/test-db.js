import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('🔍 Checking latest factories in database...\n');

    try {
        const { data, error } = await supabase
            .from('factories')
            .select('id, factory_code, name, city, industry, country, email, phone')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error:', error);
        } else {
            console.log(`Found ${data.length} factories:\n`);
            data.forEach((factory, index) => {
                console.log(`Factory ${index + 1}:` );
                console.log(`  ID: ${factory.id || '(empty)'}`);
                console.log(`  Factory Code: ${factory.factory_code || '(empty)'}`);
                console.log(`  Name: ${factory.name || '(empty)'}`);
                console.log(`  City: ${factory.city || '(empty)'}`);
                console.log(`  Country: ${factory.country || '(empty)'}`);
                console.log(`  Industry: ${factory.industry || '(empty)'}`);
                console.log(`  Email: ${factory.email || '(empty)'}`);
                console.log(`  Phone: ${factory.phone || '(empty)'}`);
                console.log('---');
            });
        }
    } catch (err) {
        console.error('System Error:', err);
    }
}

test();
