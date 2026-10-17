import type {Order} from './types';
export const insightEvents=['product_view','cart_add','box_open','box_complete','box_abandon','checkout_start','checkout_exit'] as const;
export type InsightEvent=typeof insightEvents[number];
export type ShopInsight={event:InsightEvent;productId?:string;quantity:number;day:string};
export type ShopReview={id:string;orderId:string;name:string;text:string;rating:number;published:boolean;consent:boolean;created:string};
export type PublicReview=Pick<ShopReview,'id'|'name'|'text'|'rating'>;
export type GroupInquiry={id:string;customer:string;phone:string;occasion:string;quantity:number;date:string;note:string;status:'Yeni'|'Görüşülüyor'|'Tamamlandı';created:string};
export function publicReview(r:ShopReview):PublicReview|null{
 return r.published&&r.consent?{id:r.id,name:r.name,text:r.text,rating:r.rating}:null;
}
export function insightSummary(events:ShopInsight[]){
 const counts=Object.fromEntries(insightEvents.map(event=>[event,0])) as Record<InsightEvent,number>;
 const products:Record<string,{views:number;adds:number;quantity:number}>={};
 for(const e of events){if(!insightEvents.includes(e.event))continue;counts[e.event]++;
  if(e.productId){const p=products[e.productId]??={views:0,adds:0,quantity:0};if(e.event==='product_view')p.views++;if(e.event==='cart_add'){p.adds++;p.quantity+=e.quantity;}}
 }
 return {counts,products};
}

export function orderProgress(orders:Order[],since:string){
 const paidStatuses=['Ödeme alındı','Hazırlanıyor','Teslim edildi'];
 const localDay=(value:string)=>{const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date):'';};
 const recent=orders.filter(o=>!o.demo&&localDay(o.created)>=since);
 const current=Object.fromEntries(['Onay bekliyor','Ödeme bekleniyor','Ödeme alındı','Onaylandı','Hazırlanıyor','Teslim edildi','İptal'].map(s=>[s,0]));
 for(const o of recent){const status=o.status==='Yeni'?'Onay bekliyor':o.status;if(status in current)current[status]++;}
 const verified=recent.filter(o=>paidStatuses.includes(o.status)||(o.statusHistory||[]).some(h=>paidStatuses.includes(h.to)));
 const activePaid=recent.filter(o=>paidStatuses.includes(o.status));
 return {requests:recent.length,verified:verified.length,current,activePaidTotal:activePaid.reduce((n,o)=>n+o.total,0)};
}
