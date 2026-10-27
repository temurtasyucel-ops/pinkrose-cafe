import {service} from '@/lib/supabase/service';
import {failureResponse} from '@/lib/diagnostics';

export const dynamic='force-dynamic';
export const maxDuration=10;

export async function GET(){
  try{
    const {error}=await service().from('records').select('id').limit(1);
    if(error)return failureResponse('health','database',error,503,'Hizmet geçici olarak kullanılamıyor.');
    return Response.json({status:'ok'},{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
  }catch(error){
    return failureResponse('health','database',error,503,'Hizmet geçici olarak kullanılamıyor.');
  }
}
