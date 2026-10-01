import {createHash} from 'node:crypto';
import {service} from '@/lib/supabase/service';
export async function rateLimit(request:Request,scope:string,limit:number){
  const ip=(request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  const key=createHash('sha256').update(scope+':'+ip).digest('hex');
  const {data,error}=await service().rpc('consume_rate_limit',{p_key:key,p_limit:limit});
  if(error){console.error('Rate limit:',error.message);throw Error('İstek şu anda işlenemiyor.');}
  return data===true;
}
