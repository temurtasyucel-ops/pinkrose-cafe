import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {supabaseSecretKey,supabaseUrl} from '@/lib/env';

export function service(){
  return createClient(supabaseUrl(),supabaseSecretKey(),{auth:{persistSession:false,autoRefreshToken:false}});
}
