import {authClient} from '@/lib/supabase/server';
import {service} from '@/lib/supabase/service';

export class AdminError extends Error{constructor(message:string,public status:number){super(message);}}
export async function admin(){
  const auth=await authClient();
  const {data:{user},error}=await auth.auth.getUser();
  if(error || !user)throw new AdminError('Giriş yapmanız gerekiyor.',401);
  const {data,error:lookupError}=await service().from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  if(lookupError)throw new AdminError('Yönetici yetkisi doğrulanamadı. Lütfen tekrar deneyin.',503);
  if(!data)throw new AdminError('Bu panel için yetkiniz yok.',403);
  return user;
}
export function sameOrigin(request:Request){
  const origin=request.headers.get('origin');
  const url=new URL(request.url);
  const host=request.headers.get('host') || url.host;
  const protocol=request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || url.protocol.slice(0,-1);
  if(!origin || origin!==`${protocol}://${host}`)throw Error('İstek doğrulanamadı.');
}
