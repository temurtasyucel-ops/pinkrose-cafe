import {cleanGift} from '@/lib/shop-experience';
import {deliveryPreference,leadDays} from '@/lib/order-date';
import {assertPreferredDate,orderBooking} from '@/lib/order-calendar';
import {reserveCalendar,settleCalendar} from '@/db/order-calendar';
import {catalog,orderByKey,saveOrder} from '@/db/store';
import {Order,customerOrderMessage} from '@/lib/types';
import {trackingPath} from '@/lib/order-tracking';
import {priceBasket,boxEligible} from '@/lib/pricing';
import {sameOrigin} from '@/lib/admin';
import {rateLimit} from '@/lib/rate-limit';
import {normalizePhoneForRateLimit} from '@/lib/phone';
import {cartQuote,campaignPercent} from '@/lib/cart-review';
import {ServiceFailure,failureResponse} from '@/lib/diagnostics';
export const maxDuration=60;
const result=(o:Order)=>Response.json({number:o.number,total:o.total,deliveryFeePending:!!o.deliveryFeePending,demo:o.demo,whatsappMessage:customerOrderMessage(o),trackingPath:trackingPath(o.trackingToken||'')},{headers:{'Cache-Control':'private, no-store'}});
export async function POST(req:Request){let stage='request';try{
 sameOrigin(req);
 if(Number(req.headers.get('content-length')||0)>15000)throw Error('Sipariş bilgileri çok uzun.');
 stage='rate_limit';if(!await rateLimit(req,'orders',10))return Response.json({error:'Çok fazla istek. Bir dakika sonra tekrar deneyin.'},{status:429});
 stage='validation';
 const b:any=await req.json();
 if(b.website!==undefined&&(typeof b.website!=='string'||b.website.trim()!==''))return Response.json({error:'İstek doğrulanamadı.'},{status:400});
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.key||''))throw Error('Sipariş doğrulanamadı.');
 stage='lookup';const old=await orderByKey(b.key);if(old){stage='finalize';if(orderBooking(old))await settleCalendar('hold:new:'+b.key,old.id);return result(old);}
 stage='validation';
 const s=(v:unknown,n=500)=>typeof v==='string'?v.trim().slice(0,n):'';
 const customer=s(b.customer,100),phone=s(b.phone,25).replace(/\D/g,'');
 if(customer.length<2||!/^(0?5\d{9}|905\d{9})$/.test(phone))throw Error('Adınızı ve geçerli bir cep telefonu numarasını girin.');
 stage='rate_limit';if(!await rateLimit(req,'orders-phone',5,3600,normalizePhoneForRateLimit(phone)))return Response.json({error:'Bu telefon numarasıyla kısa sürede çok fazla sipariş talebi oluşturuldu. Lütfen daha sonra tekrar deneyin.'},{status:429});
 stage='validation';
 if(!['Teslimat','Gel-al'].includes(b.type)||b.type==='Teslimat'&&s(b.address).length<10)throw Error('Teslimat adresini girin.');
 if(b.type==='Teslimat'&&!['Manisa','İzmir'].includes(b.city))throw Error('Teslimat için Manisa veya İzmir seçin.');
 if(!Array.isArray(b.items)||b.items.length<1||b.items.length>30)throw Error('Sepetinizi kontrol edin.');
 stage='catalog';const c=await catalog();stage='validation';
 if(c.settings.ordersPaused)return Response.json({error:c.settings.pauseMessage||'Şu an yeni sipariş alamıyoruz. Lütfen daha sonra tekrar deneyin.'},{status:409});
 const seen=new Set();
 const items=b.items.map((i:{id:string;qty:number})=>{
  const p=c.products.find(p=>p.id===i.id);
  if(!p||!p.active||!p.stock||!Number.isInteger(i.qty)||i.qty<1||i.qty>50||seen.has(i.id))throw Error('Bir ürün tükendi veya miktarı geçersiz. Sepetinizi yenileyin.');
  seen.add(i.id);return {id:p.id,name:p.name,price:p.price,qty:i.qty};
 });
 const pricingNow=new Date();
 if(b.quote!==undefined&&(typeof b.quote!=='string'||b.quote.length>6000||b.quote!==cartQuote(c,Object.fromEntries(items.map((i:{id:string;qty:number})=>[i.id,i.qty])),b.type,pricingNow)))return failureResponse('orders','pricing',new Error('Quote changed'),409,'Sepetindeki fiyatlar veya koşullar değişti. Güncel sepeti kontrol edip tekrar dene.');
 const capacityQty=items.reduce((n:number,i:{id:string;qty:number})=>n+(boxEligible(c.products.find(p=>p.id===i.id)!)?i.qty:0),0);
 // Old clients may omit a structured date only while no calendar restrictions exist.
 // Enabling closed days or a limit makes a valid date mandatory on the server.
 const calendarConfigured=!!c.calendar&&(c.calendar.dailyLimit>0||c.calendar.closedDates.length>0);
 const preferredDate=b.preferredDate?assertPreferredDate(b.preferredDate,c.settings,c.calendar,c.settings.demo?0:capacityQty):'';
 if(!preferredDate&&!c.settings.demo&&(calendarConfigured||b.preferredDate!==undefined))throw Error('Lütfen uygun bir teslim günü seçin.');
 const preferred=b.preferredDate!==undefined||b.preferredTime!==undefined?deliveryPreference(preferredDate,b.preferredTime??'',leadDays(c.settings),b.language==='en'?'en':'tr'):s(b.date,100);
 const subtotal=items.reduce((n:number,i:{price:number;qty:number})=>n+i.price*i.qty,0);
 const percent=campaignPercent(c,pricingNow),packageDiscount=priceBasket(c,items).packageDiscount;
 const discount=packageDiscount+Math.round((subtotal-packageDiscount)*percent/100),deliveryFeePending=b.type==='Teslimat'&&!!c.settings.deliveryQuoted,deliveryFee=b.type==='Teslimat'&&!deliveryFeePending?c.settings.deliveryFee:0;
 const id=b.key,number='PR-'+id.slice(0,8).toUpperCase();
 const order:Order={trackingToken:crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-',''),preferredDate,capacityQty,gift:cleanGift(b.gift),language:b.language==='en'?'en':'tr',id,number,customer,phone,type:b.type,city:b.type==='Teslimat'?b.city:undefined,deliveryFeePending,address:s(b.address),note:s(b.note),date:preferred,items,subtotal,discount,deliveryFee,total:subtotal-discount+deliveryFee,status:'Onay bekliyor',created:new Date().toISOString(),demo:c.settings.demo};
 const booking=orderBooking(order),hold='hold:new:'+b.key;
 stage='capacity';if(booking)await reserveCalendar(hold,booking);
 // Keep a reservation on uncertain storage failures. Retrying uses the same key;
 // it cannot duplicate the order or reserve a second capacity slot.
 stage='save';const o=await saveOrder(b.key,order);
 stage='finalize';if(booking)await settleCalendar(hold,o.id);
 return result(o);
 }catch(e){const technical=e instanceof ServiceFailure||['rate_limit','lookup','catalog','save','finalize'].includes(stage)||!(e instanceof Error)||e instanceof TypeError;const status=technical?503:400;const message=technical?'Sipariş sonucu şu anda doğrulanamıyor. Aynı talebi tekrar deneyin.':e instanceof SyntaxError?'Geçerli sipariş bilgileri gönderin.':(e as Error).message;return failureResponse('orders',stage,e,status,message);}}
