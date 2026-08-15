import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
        'VITE_SUPABASE_URL atau VITE_SUPABASE_SERVICE_ROLE_KEY belum diatur di file .env'
    );
}

export const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            storageKey: 'sb-admin-service-role-token',
        },
    }
);
