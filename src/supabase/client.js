import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nrrpqkqkztbbvgwnaguh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_33zO-E4C0wcaKf-Zb6iOiQ_fAhQj6pi';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
