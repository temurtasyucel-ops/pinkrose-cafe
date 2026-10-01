import {service} from '@/lib/supabase/service';
export async function GET(req:Request,{params}:{params:Promise<{key:string}>}){
  const {key}=await params;
  if(!/^[a-z0-9-]{36}$/.test(key))return new Response(null,{status:404});
  try{
    const {data,error}=await service().storage.from('product-images').download(key);
    if(error || !data)return new Response(null,{status:404});
    return new Response(await data.arrayBuffer(),{headers:{'Content-Type':data.type || 'image/jpeg','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
  }catch{return new Response(null,{status:503});}
}
