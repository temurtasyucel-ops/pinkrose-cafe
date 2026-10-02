export type Product={id:string;name:string;category:string;description:string;ingredients:string;allergens:string;price:number;oldPrice:number;image:string;insideImage?:string;weight?:string;active:boolean;stock:boolean;featured:boolean;boxEligible?:boolean;storageInfo?:string;heatingInfo?:string;sort:number};
export type Campaign={id:string;title:string;text:string;discount:number;start:string;end:string;active:boolean};
export type Settings={whatsapp:string;instagram:string;deliveryText:string;deliveryFee:number;deliveryQuoted?:boolean;pickupAddress?:string;pickupHours?:string;pickupMapUrl?:string;ordersPaused?:boolean;pauseMessage?:string;paymentText?:string;preparationText?:string;storageInfo?:string;heatingInfo?:string;demo:boolean};
export type Catalog={products:Product[];categories:string[];campaigns:Campaign[];settings:Settings;packages:{qty:number;name:string;price:number}[];tastingPrice:number;tastingIds?:string[]};
export type Order={id:string;number:string;customer:string;phone:string;type:string;city?:string;deliveryFeePending?:boolean;address:string;note:string;date:string;items:{id:string;name:string;price:number;qty:number}[];subtotal:number;discount:number;deliveryFee:number;total:number;status:string;created:string;demo:boolean};
export const money=(c:number)=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(c/100);
export const liveCampaign=(c:Campaign)=>c.active&&(!c.start||new Date(c.start).getTime()<=Date.now())&&(!c.end||new Date(c.end).getTime()>=Date.now());
export const statuses=['Onay bekliyor','Ödeme bekleniyor','Ödeme alındı','Onaylandı','Hazırlanıyor','Teslim edildi','İptal'];

export const orderStatus=(status:string)=>status==='Yeni'?'Onay bekliyor':status;
export function customerWhatsApp(order:Order):string|null{
 const digits=order.phone.replace(/\D/g,'');
 const phone=/^05\d{9}$/.test(digits)?'90'+digits.slice(1):/^5\d{9}$/.test(digits)?'90'+digits:digits;
 if(!/^905\d{9}$/.test(phone))return null;
 const message='Merhaba '+order.customer+', Pink Rose Cafe’den yazıyoruz. '+order.number+' numaralı '+(order.demo?'deneme siparişiniz':'sipariş talebiniz')+' hakkında sizinle görüşmek istiyoruz. '+(order.deliveryFeePending?'Teslimat hariç ürün toplamı: ':'Toplam: ')+money(order.total)+(order.deliveryFeePending?'. Teslimat ücretini adresinize göre netleştirelim.':'.');
 return 'https://wa.me/'+phone+'?text='+encodeURIComponent(message);
}

export function deliveryQuote(order:Order,fee:number):Order{
 if(order.type!=='Teslimat')throw Error('Gel-al siparişine teslimat ücreti eklenemez.');
 if(!Number.isSafeInteger(fee)||fee<0||fee>10000000)throw Error('Geçerli teslimat bedeli girin.');
 return {...order,deliveryFee:fee,deliveryFeePending:false,total:order.subtotal-order.discount+fee};
}
export function filterOrders(orders:Order[],query:string,status:string,mode:string):Order[]{
 const q=query.trim().toLocaleLowerCase('tr-TR'),digits=q.replace(/\D/g,'');
 return orders.filter(o=>(status==='Tümü'||orderStatus(o.status)===status)&&(mode==='Tümü'||(mode==='Deneme'?o.demo:!o.demo))&&(!q||[o.number,o.customer,o.phone].some(v=>v.toLocaleLowerCase('tr-TR').includes(q))||(/^\+?[\d\s()-]+$/.test(q)&&digits.length>0&&o.phone.replace(/\D/g,'').includes(digits))));
}

export function orderSummary(o:Order){
 return [o.demo?'Pink Rose · Deneme siparişi':'Pink Rose · Sipariş talebi',o.number,'Müşteri: '+o.customer,'Telefon: '+o.phone,'Durum: '+orderStatus(o.status),o.type+(o.city?' · '+o.city:''),o.type==='Teslimat'&&o.address?'Adres: '+o.address:'',o.date?'Zaman tercihi: '+o.date:'',...o.items.map(p=>p.qty+' × '+p.name+' · '+money(p.price*p.qty)),'Ara toplam: '+money(o.subtotal),'İndirim: '+money(o.discount),'Teslimat: '+(o.type==='Gel-al'?'Ücretsiz':o.deliveryFeePending?'Ücret henüz belirlenmedi':money(o.deliveryFee)),(o.deliveryFeePending?'Teslimat hariç ürün toplamı: ':'Toplam: ')+money(o.total),o.note?'Not: '+o.note:''].filter(Boolean).join('\n');
}
