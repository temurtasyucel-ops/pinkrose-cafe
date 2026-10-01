export type Product={id:string;name:string;category:string;description:string;ingredients:string;allergens:string;price:number;oldPrice:number;image:string;insideImage?:string;weight?:string;active:boolean;stock:boolean;featured:boolean;sort:number};
export type Campaign={id:string;title:string;text:string;discount:number;start:string;end:string;active:boolean};
export type Settings={whatsapp:string;instagram:string;deliveryText:string;deliveryFee:number;deliveryQuoted?:boolean;demo:boolean};
export type Catalog={products:Product[];categories:string[];campaigns:Campaign[];settings:Settings;packages:{qty:number;name:string;price:number}[];tastingPrice:number};
export type Order={id:string;number:string;customer:string;phone:string;type:string;city?:string;deliveryFeePending?:boolean;address:string;note:string;date:string;items:{id:string;name:string;price:number;qty:number}[];subtotal:number;discount:number;deliveryFee:number;total:number;status:string;created:string;demo:boolean};
export const money=(c:number)=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(c/100);
export const liveCampaign=(c:Campaign)=>c.active&&(!c.start||new Date(c.start).getTime()<=Date.now())&&(!c.end||new Date(c.end).getTime()>=Date.now());
export const statuses=['Yeni','Onaylandı','Hazırlanıyor','Teslim edildi','İptal'];
