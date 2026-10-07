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
export function basketOffer(c:Catalog,cart:Record<string,number>){
 const products=c.products.filter(p=>p.active&&p.stock&&boxEligible(p)&&cart[p.id]>0);
 if(!products.some(p=>p.price>c.bulkPricing.unitPrice))return null;
 const count=products.reduce((n,p)=>n+cart[p.id],0);
 const savings=count>=c.bulkPricing.minQty?products.reduce((n,p)=>n+Math.max(0,p.price-c.bulkPricing.unitPrice)*cart[p.id],0):0;
 return {remaining:Math.max(0,c.bulkPricing.minQty-count),savings,unitPrice:c.bulkPricing.unitPrice};
}
export function seasonalProducts(c:Catalog){return c.products.filter(p=>p.seasonal&&p.active&&p.stock);}
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
