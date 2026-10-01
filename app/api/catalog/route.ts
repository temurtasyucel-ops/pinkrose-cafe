import {catalog} from '@/db/store';
export async function GET(){try{return Response.json(await catalog(),{headers:{'Cache-Control':'no-store'}});}catch(e){console.error(e);return Response.json({error:'Ürünler yüklenemedi. Lütfen tekrar deneyin.'},{status:503});}}
