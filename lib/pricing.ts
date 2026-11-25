import type {Catalog,Product} from './types';
export const defaultBulkPricing={minQty:2,unitPrice:18000,tiers:[{minQty:2,unitPrice:18000},{minQty:4,unitPrice:17000},{minQty:6,unitPrice:16500},{minQty:8,unitPrice:16000}],extraUnitPrice:15000};
export type PricingTier={minQty:number;unitPrice:number};
export type BulkPricing=typeof defaultBulkPricing;
export function normalizeBulkPricing(value:unknown):Catalog['bulkPricing']{const v=value as Catalog['bulkPricing']|null;if(!validBulkPricing(v)||!v.tiers)return defaultBulkPricing;return {...defaultBulkPricing,...v};}
export function boxEligible(p:Product){return p.boxEligible??/^cookie-[1-7]$/.test(p.id);}
export function pricingTiers(rule:Catalog['bulkPricing']):PricingTier[]{return Array.isArray(rule.tiers)&&rule.tiers.length===4?[...rule.tiers].sort((a,b)=>a.minQty-b.minQty):[{minQty:rule.minQty,unitPrice:rule.unitPrice}];}
export function tierUnitPrice(qty:number,rule:Catalog['bulkPricing']):number|null{
 if(qty<rule.minQty)return null;
 const tiers=pricingTiers(rule);
 if(qty>=8&&rule.extraUnitPrice&&qty>8)return rule.extraUnitPrice;
 const tier=[...tiers].reverse().find(t=>qty>=t.minQty);
 return tier?.unitPrice??rule.unitPrice;
}
export function bulkPackagePrice(qty:number,rule:Catalog['bulkPricing']):number{
 if(qty<=0)return 0;
 const tiers=pricingTiers(rule);
 if(tiers.length===4&&tiers.map(t=>t.minQty).join(',')==='2,4,6,8'){
  if(qty===1)return 0;
  if(qty<=3)return qty*tiers[0].unitPrice;
  if(qty<=5)return qty*tiers[1].unitPrice;
  if(qty<=7)return qty*tiers[2].unitPrice;
  return qty===8?qty*tiers[3].unitPrice:8*tiers[3].unitPrice+(qty-8)*(rule.extraUnitPrice??tiers[3].unitPrice);
 }
 const unit=tierUnitPrice(qty,rule);
 return unit===null?0:qty*unit;
}
export function quantityOffer(c:Catalog){
 const products=c.products.filter(p=>p.active&&p.stock&&boxEligible(p));
 const tiers=pricingTiers(c.bulkPricing);
 if(!products.length||!tiers.length||!products.some(p=>p.price>tiers[0].unitPrice))return null;
 const prices=products.map(p=>p.price);
 return {minQty:tiers[0].minQty,singleMin:Math.min(...prices),singleMax:Math.max(...prices),discountMin:Math.min(...products.map(p=>Math.min(p.price,tiers[0].unitPrice))),discountMax:Math.min(...products.map(p=>Math.min(p.price,tiers[0].unitPrice))),tiers,extraUnitPrice:c.bulkPricing.extraUnitPrice};
}
export function basketOffer(c:Catalog,cart:Record<string,number>){
 const products=c.products.filter(p=>p.active&&p.stock&&boxEligible(p)&&cart[p.id]>0);
 if(!products.length)return null;
 const count=products.reduce((n,p)=>n+cart[p.id],0),tiers=pricingTiers(c.bulkPricing);
 const quote=priceBasket(c,products.map(p=>({id:p.id,price:p.price,qty:cart[p.id]})));
 const savings=quote.packageDiscount;
 if(!savings)return null;
 return {remaining:Math.max(0,tiers[0].minQty-count),savings,unitPrice:tiers[0].unitPrice,tiers,extraUnitPrice:c.bulkPricing.extraUnitPrice};
}
export function seasonalProducts(c:Catalog){return c.products.filter(p=>p.seasonal&&p.active&&p.stock);}
export function validBulkPricing(value:unknown):value is Catalog['bulkPricing']{
 const v=value as Catalog['bulkPricing']|null;
 if(!v||!Number.isSafeInteger(v.minQty)||v.minQty<1||v.minQty>100||!Number.isSafeInteger(v.unitPrice)||v.unitPrice<=0||v.unitPrice>10000000)return false;
 if(v.tiers!==undefined&&(!Array.isArray(v.tiers)||v.tiers.length!==4||v.tiers.some((t,i)=>!t||t.minQty!==[2,4,6,8][i]||!Number.isSafeInteger(t.unitPrice)||t.unitPrice<=0||t.unitPrice>10000000)))return false;
 return v.extraUnitPrice===undefined||(Number.isSafeInteger(v.extraUnitPrice)&&v.extraUnitPrice>0&&v.extraUnitPrice<=10000000);
}
export function basketLines(c:Catalog,items:{id:string;price:number;qty:number}[]){
 const eligible=new Set(c.products.filter(boxEligible).map(p=>p.id));
 const count=items.filter(i=>eligible.has(i.id)).reduce((n,i)=>n+i.qty,0);
 const rule=c.bulkPricing,tiers=pricingTiers(rule);
 const expanded=items.flatMap(item=>eligible.has(item.id)?Array.from({length:item.qty},()=>({id:item.id,price:item.price,eligible:true})):Array.from({length:item.qty},()=>({id:item.id,price:item.price,eligible:false})));
 const unitRates=expanded.map((item,index)=>{
  if(!item.eligible||count<rule.minQty)return item.price;
  if(!rule.tiers)return Math.min(item.price,rule.unitPrice);
  const eligibleIndex=expanded.slice(0,index+1).filter(x=>x.eligible).length-1;
  const rate=count<=3?tiers[0].unitPrice:count<=5?tiers[1].unitPrice:count<=7?tiers[2].unitPrice:eligibleIndex<8?tiers[3].unitPrice:(rule.extraUnitPrice??tiers[3].unitPrice);
  return Math.min(item.price,rate);
 });
 let cursor=0;
 return items.map(item=>{
  const unitTotals=expanded.slice(cursor,cursor+item.qty).map((_,i)=>unitRates[cursor+i]);cursor+=item.qty;
  const lineTotal=unitTotals.reduce((sum,n)=>sum+n,0);
  return {...item,unitPrice:item.qty?Math.round(lineTotal/item.qty):item.price,lineTotal};
 });
}
export function priceBasket(c:Catalog,items:{id:string;price:number;qty:number}[]){
 const lines=basketLines(c,items);
 const subtotal=lines.reduce((n,i)=>n+i.price*i.qty,0);
 const packageDiscount=lines.reduce((n,i)=>n+(i.price*i.qty-i.lineTotal),0);
 return {subtotal,packageDiscount,total:subtotal-packageDiscount,lines};
}
export function boxPriceRange(c:Catalog,qty:number){
 const products=c.products.filter(p=>p.active&&p.stock&&boxEligible(p));
 if(!products.length)return null;
 const rates=pricingTiers(c.bulkPricing);
 const unit=qty===1?products.map(p=>p.price):products.map(p=>Math.min(p.price,tierUnitPrice(qty,c.bulkPricing)??p.price));
 const min=Math.min(...unit),max=Math.max(...unit);
 return {min:bulkPackagePrice(qty,c.bulkPricing),max:bulkPackagePrice(qty,c.bulkPricing),unitMin:min,unitMax:max};
}
