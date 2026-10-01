import {sameOrigin} from '@/lib/admin';
import {authClient} from '@/lib/supabase/server';
export async function POST(request:Request){
  try{sameOrigin(request);const auth=await authClient();const {error}=await auth.auth.signOut();if(error)throw error;return Response.redirect(new URL('/panel/login',request.url),303);}
  catch{return Response.json({error:'Çıkış yapılamadı. Lütfen tekrar deneyin.'},{status:400});}
}
