import {service} from '@/lib/supabase/service';
import {admin,sameOrigin,AdminError} from '@/lib/admin';
import {ServiceFailure,failureResponse} from '@/lib/diagnostics';
import {rateLimit} from '@/lib/rate-limit';
export async function POST(req:Request){
  let stage='request';
  try{
    sameOrigin(req);if(Number(req.headers.get('content-length')||0)>5*1024*1024)return Response.json({error:'Yükleme isteği çok büyük.'},{status:413});if(!await rateLimit(req,'upload',10))return Response.json({error:'Çok fazla fotoğraf yükleme denemesi. Biraz sonra tekrar deneyin.'},{status:429});stage='authorization';await admin();
    stage='validation';
    const form=await req.formData(),file=form.get('file');
    if(!(file instanceof File)||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>4*1024*1024)throw Error('En fazla 4 MB JPEG, PNG veya WebP seçin.');
    const bytes=new Uint8Array(await file.arrayBuffer());
    const valid=file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
    if(!valid)throw Error('Geçerli fotoğraf seçin.');
    const key=crypto.randomUUID();
    stage='upload';
    const {error}=await service().storage.from('product-images').upload(key,bytes,{contentType:file.type,upsert:false});
    if(error)throw new ServiceFailure('Fotoğraf yüklenemedi.','STORAGE_UPLOAD');
    return Response.json({url:'/api/images/'+key});
  }catch(e){const status=e instanceof AdminError?e.status:e instanceof ServiceFailure||['authorization','upload'].includes(stage)?503:400;const message=status>=500?'Fotoğraf yüklenemedi. Lütfen tekrar deneyin.':e instanceof Error&&e.name==='Error'?e.message:e instanceof AdminError?e.message:'Geçerli bir fotoğraf seçin.';return failureResponse('upload',stage,e,status,message);}
}
