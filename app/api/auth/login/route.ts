import {sameOrigin,admin,AdminError} from '@/lib/admin';
import {authClient} from '@/lib/supabase/server';
import {rateLimit} from '@/lib/rate-limit';

export async function POST(request:Request){
  try{
    sameOrigin(request);
    if(!await rateLimit(request,'login',15))return Response.json({error:'Çok fazla giriş denemesi. Bir dakika sonra tekrar deneyin.'},{status:429});
    const {email,password}=await request.json();
    if(typeof email!=='string' || typeof password!=='string' || email.length>254 || password.length>256)return Response.json({error:'E-posta ve şifrenizi kontrol edin.'},{status:400});
    if(!await rateLimit(request,'login-email',5,900,email.trim().toLowerCase()))return Response.json({error:'Bu hesap için çok fazla giriş denemesi yapıldı. 15 dakika sonra tekrar deneyin.'},{status:429});
    const auth=await authClient();
    const {error}=await auth.auth.signInWithPassword({email:email.trim(),password});
    if(error)return Response.json({error:'E-posta veya şifre hatalı.'},{status:401});
    try{await admin();}catch(e){await auth.auth.signOut();if(e instanceof AdminError&&e.status===403)return Response.json({error:'Bu hesabın yönetim paneli yetkisi bulunmuyor.'},{status:403});throw e;}
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  }catch(e){console.error('Login:',e);return Response.json({error:'Giriş hizmeti şu anda kullanılamıyor.'},{status:503});}
}
