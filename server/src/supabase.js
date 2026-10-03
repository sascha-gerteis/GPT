import {createClient} from '@supabase/supabase-js';
import {config} from './config.js';
let client=null;
export function supabaseAdmin(){
  if(client)return client;
  if(!config.supabaseUrl||!config.supabaseServiceRoleKey)throw Object.assign(new Error('Supabase server credentials are not configured.'),{status:503});
  client=createClient(config.supabaseUrl,config.supabaseServiceRoleKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  return client;
}
