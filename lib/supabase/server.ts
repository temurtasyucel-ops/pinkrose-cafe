import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {supabasePublishableKey,supabaseUrl} from '@/lib/env';

export async function authClient(){
  const url=supabaseUrl();
  const key=supabasePublishableKey();
  const jar=await cookies();
  return createServerClient(url,key,{
    cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
    cookies:{getAll:()=>jar.getAll(),setAll(values){
      try{for(const {name,value,options} of values)jar.set(name,value,options);}
      catch{/* Server components read cookies; proxy refreshes them. */}
    }}
  });
}
