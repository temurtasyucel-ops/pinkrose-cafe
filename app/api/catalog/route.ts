import {catalog} from '@/db/store';
import {failureResponse} from '@/lib/diagnostics';
export async function GET(){try{return Response.json(await catalog(),{headers:{'Cache-Control':'no-store'}});}catch(e){return failureResponse('catalog','load',e,503,'Ürünler yüklenemedi. Lütfen tekrar deneyin.');}}
