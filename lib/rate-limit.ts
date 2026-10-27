import {createHash} from 'node:crypto';
import {ServiceFailure} from '@/lib/diagnostics';
import {service} from '@/lib/supabase/service';

export async function rateLimit(request:Request,scope:string,limit:number,windowSeconds=60,identity?:string){
  const forwarded=request.headers.get('x-vercel-forwarded-for');
  const ip=(forwarded || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const subject=identity?'identity:'+identity:'ip:'+ip;
  const key=createHash('sha256').update(scope+':'+subject).digest('hex');
  const {data,error}=await service().rpc('consume_rate_limit',{p_key:key,p_limit:limit,p_window_seconds:windowSeconds});
  if(error)throw new ServiceFailure('İstek şu anda işlenemiyor.',error.code);
  return data===true;
}
