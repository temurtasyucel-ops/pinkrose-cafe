import type {Catalog,Product} from './types';
export const defaultBulkPricing={minQty:2,unitPrice:15000};
export function boxEligible(p:Product){return p.boxEligible??/^cookie-[1-7]$/.test(p.id);}
export function quantityOffer(c:Catalog){
 const products=c.products.filter(p=>p.active&&p.stock&&boxEligible(p));
 const rule=c.bulkPricing;
 if(!products.length||!products.some(p=>p.price>rule.unitPrice))return null;
 const prices=products.map(p=>p.price),discounted=prices.map(price=>Math.min(price,rule.unitPrice));
 return {minQty:rule.minQty,singleMin:Math.min(...prices),singleMax:Math.max(...prices),discountMin:Math.min(...discounted),discountMax:Math.max(...discounted)};
}
export function validBulkPricing(value:unknown):value is Catalog['bulkPricing']{
 const v=value as Catalog['bulkPricing']|null;
 return !!v&&Number.isSafeInteger(v.minQty)&&v.minQty>=1&&v.minQty<=100&&Number.isSafeInteger(v.unitPrice)&&v.unitPrice>0&&v.unitPrice<=10000000;
}
export function priceBasket(c:Catalog,items:{id:string;price:number;qty:number}[]){
 const eligible=new Set(c.products.filter(boxEligible).map(p=>p.id));
 const cookies=items.filter(i=>eligible.has(i.id));
 const subtotal=items.reduce((n,i)=>n+i.price*i.qty,0);
 const count=cookies.reduce((n,i)=>n+i.qty,0);
 const rule=c.bulkPricing;
 const packageDiscount=count>=rule.minQty?cookies.reduce((n,i)=>n+Math.max(0,i.price-rule.unitPrice)*i.qty,0):0;
 return {subtotal,packageDiscount};
}
