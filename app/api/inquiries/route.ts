import {assertPreferredDate} from '@/lib/order-calendar';
import {sameOrigin} from '@/lib/admin';
import {rateLimit} from '@/lib/rate-limit';
import {catalog,put} from '@/db/store';
import {deliveryPreference,leadDays} from '@/lib/order-date';
import {turkeyDate} from '@/lib/shop-experience';
export async function POST(req:Request){try{
 sameOrigin(req);
 if(Number(req.headers.get('content-length')||0)>6000)throw Error('Talep çok uzun.');
 if(!await rateLimit(req,'inquiries',4))return Response.json({error:'Çok fazla istek. Bir dakika sonra tekrar deneyin.'},{status:429});
 const b=await req.json(),s=(v:unknown,n=500)=>typeof v==='string'?v.trim().slice(0,n):'';
 if(b.website)return Response.json({ok:true});
 const customer=s(b.customer,100),phone=s(b.phone,25).replace(/\D/g,''),quantity=Number(b.quantity),occasion=s(b.occasion,80);
 if(customer.length<2||!/^(0?5\d{9}|905\d{9})$/.test(phone)||!Number.isInteger(quantity)||quantity<10||quantity>10000||!['Ofis / kurumsal','Doğum günü','Etkinlik / davet','Diğer'].includes(occasion))throw Error('Ad, telefon, etkinlik türü ve en az 10 adet için talep bilgilerini kontrol edin.');
 const c=await catalog();if(c.settings.ordersPaused)throw Error(c.settings.pauseMessage||'Şu an yeni sipariş alamıyoruz.');
 if(c.settings.demo)throw Error('Deneme modunda toplu sipariş talebi alınmaz.');
 if(b.date)assertPreferredDate(b.date,c.settings,c.calendar,quantity);
 const date=deliveryPreference(b.date||'','',leadDays(c.settings),'tr'),id='inquiry-'+turkeyDate().replaceAll('-','')+'-'+crypto.randomUUID();
 await put(id,'inquiry',{id,customer,phone,quantity,occasion,date,note:s(b.note),created:new Date().toISOString(),status:'Yeni'});
 return Response.json({ok:true});
 }catch(e){return Response.json({error:(e as Error).message},{status:400});}}
