import {createHash} from 'node:crypto';
import {ServiceFailure} from '@/lib/diagnostics';
import {service} from '@/lib/supabase/service';
export async function rateLimit(request:Request,scope:string,limit:number){
  const ip=(request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  const key=createHash('sha256').update(scope+':'+ip).digest('hex');
  const {data,error}=await service().rpc('consume_rate_limit',{p_key:key,p_limit:limit});
  if(error)throw new ServiceFailure('İstek şu anda işlenemiyor.',error.code);
  return data===true;
}
