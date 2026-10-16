import {service} from '@/lib/supabase/service';
import {orderById,put} from './store';
import type {ShopReview} from '@/lib/shop-insights';
const text=(v:unknown,n:number)=>typeof v==='string'?v.trim().slice(0,n):'';
export async function saveShopReview(data:Record<string,unknown>){
 const order=typeof data.orderId==='string'?await orderById(data.orderId):null;
 if(!order||order.demo||order.status!=='Teslim edildi')throw Error('Yorum için teslim edilmiş gerçek bir sipariş seçin.');
 const name=text(data.name,60),message=text(data.text,600),rating=Number(data.rating);
 if(name.length<2||message.length<5||!Number.isInteger(rating)||rating<1||rating>5)throw Error('Görünen ad, yorum ve 1–5 arası puan girin.');
 if(data.published&&!data.consent)throw Error('Yayınlamak için müşterinin paylaşım iznini doğrulayın.');
 const id='review-'+order.id;
 const review:ShopReview={id,orderId:order.id,name,text:message,rating,published:!!data.published,consent:!!data.consent,created:new Date().toISOString()};
 await put(id,'review',review);
}
export async function updateInquiryStatus(id:unknown,status:unknown){
 if(typeof id!=='string'||!/^inquiry-\d{8}-[a-z0-9-]{36}$/.test(id)||!['Yeni','Görüşülüyor','Tamamlandı'].includes(String(status)))throw Error('Talep veya durum geçersiz.');
 const {data,error}=await service().from('records').select('data').eq('id',id).eq('kind','inquiry').maybeSingle();
 if(error||!data)throw Error('Talep bulunamadı.');
 await put(id,'inquiry',{...data.data,status});
}
