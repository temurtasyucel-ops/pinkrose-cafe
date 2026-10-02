import {service} from '@/lib/supabase/service';
import {admin,sameOrigin,AdminError} from '@/lib/admin';
export async function POST(req:Request){
  try{
    sameOrigin(req);await admin();
    const form=await req.formData(),file=form.get('file');
    if(!(file instanceof File)||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>4*1024*1024)throw Error('En fazla 4 MB JPEG, PNG veya WebP seçin.');
    const bytes=new Uint8Array(await file.arrayBuffer());
    const valid=file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
    if(!valid)throw Error('Geçerli fotoğraf seçin.');
    const key=crypto.randomUUID();
    const {error}=await service().storage.from('product-images').upload(key,bytes,{contentType:file.type,upsert:false});
    if(error){console.error('Storage:',error.message);throw Error('Fotoğraf yüklenemedi.');}
    return Response.json({url:'/api/images/'+key});
  }catch(e){return Response.json({error:(e as Error).message},{status:e instanceof AdminError?e.status:400});}
}
