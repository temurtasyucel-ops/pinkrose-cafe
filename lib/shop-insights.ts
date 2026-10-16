export const insightEvents=['product_view','cart_add','box_open','box_complete','box_abandon'] as const;
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
