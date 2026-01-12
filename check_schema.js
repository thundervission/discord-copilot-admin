require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    const { data, error } = await supabase
        .from('agent_settings')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching settings:', error);
    } else {
        console.log('Fetched Row Keys:', Object.keys(data));
        console.log('Full Data:', data);
    }
}

checkSchema();
