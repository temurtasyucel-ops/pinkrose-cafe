import {sameOrigin} from '@/lib/admin';
import {rateLimit} from '@/lib/rate-limit';
import {service} from '@/lib/supabase/service';
import {publicOrderStatus,trackingPath} from '@/lib/order-tracking';
import type {Order} from '@/lib/types';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer'};
export async function POST(req:Request){try{
 sameOrigin(req);
 if(Number(req.headers.get('content-length')||0)>512)return Response.json({error:'Geçersiz istek.'},{status:400,headers});
 if(!await rateLimit(req,'order-status',40))return Response.json({error:'Lütfen biraz sonra tekrar deneyin.'},{status:429,headers});
 const {token}=await req.json();
 if(typeof token!=='string'||!trackingPath(token))return Response.json({error:'Sipariş bağlantısı bulunamadı.'},{status:404,headers});
 const {data,error}=await service().from('orders').select('data').eq('data->>trackingToken',token).maybeSingle();
 if(error){console.error('Tracking lookup unavailable');return Response.json({error:'Sipariş durumu şu an yüklenemiyor.'},{status:503,headers});}
 if(!data)return Response.json({error:'Sipariş bağlantısı bulunamadı.'},{status:404,headers});
 return Response.json(publicOrderStatus(data.data as Order),{headers});
 }catch{return Response.json({error:'Sipariş durumu yüklenemedi.'},{status:400,headers});}}
