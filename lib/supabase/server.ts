import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';

export async function authClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url || !key)throw Error('Yönetici girişi henüz yapılandırılmadı.');
  const jar=await cookies();
  return createServerClient(url,key,{
    cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
    cookies:{getAll:()=>jar.getAll(),setAll(values){
      try{for(const {name,value,options} of values)jar.set(name,value,options);}
      catch{/* Server components read cookies; proxy refreshes them. */}
    }}
  });
}
