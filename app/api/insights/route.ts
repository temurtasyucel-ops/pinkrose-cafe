import {sameOrigin} from '@/lib/admin';
import {rateLimit} from '@/lib/rate-limit';
import {service} from '@/lib/supabase/service';
import {turkeyDate} from '@/lib/shop-experience';
import {insightEvents} from '@/lib/shop-insights';
export async function POST(req:Request){try{
 sameOrigin(req);
 if(Number(req.headers.get('content-length')||0)>2000)return new Response(null,{status:413});
 if(!await rateLimit(req,'insights',40))return new Response(null,{status:429});
 const b=await req.json();
 if(!insightEvents.includes(b.event)||!Number.isInteger(b.quantity)||b.quantity<1||b.quantity>50)return new Response(null,{status:400});
 const productEvent=['product_view','cart_add'].includes(b.event);
 const productId=productEvent&&typeof b.productId==='string'&&/^(cookie-\d+|[a-z0-9-]{36})$/.test(b.productId)?b.productId:undefined;
 if(['product_view','cart_add'].includes(b.event)&&!productId)return new Response(null,{status:400});
 const day=turkeyDate(),id='insight-'+day.replaceAll('-','')+'-'+crypto.randomUUID();
 const {error}=await service().from('records').insert({id,kind:'insight',data:{event:b.event,productId,quantity:b.quantity,day}});
 if(error)throw error;
 // Keep anonymous interaction history bounded; customer/order records are never touched.
 if(Math.random()<0.01){const cutoff=turkeyDate(new Date(Date.now()-35*86400000));await service().from('records').delete().eq('kind','insight').lt('data->>day',cutoff);}
 return new Response(null,{status:204});
 }catch{return new Response(null,{status:400});}}
