import type {Catalog} from './types';
import {cleanCart} from './cart.ts';
import {boxEligible} from './pricing.ts';
import {productAvailable} from './shop-experience.ts';

export const cartSnapshotKey='pinkrose-cart-pricing-v1';
export const cartChangesKey='pinkrose-cart-changes-v1';
export type CartSnapshot={products:Record<string,{name:string;englishName:string;price:number;eligible:boolean}>;bulkPricing:Catalog['bulkPricing'];campaignPercent:number;deliveryFee:number;deliveryQuoted:boolean;demo:boolean};
export type CartChange={kind:'removed'|'price'|'terms';id:string;name:string;englishName:string;before?:number;after?:number};
export function cleanCartChanges(value:unknown):CartChange[]{if(!Array.isArray(value))return [];return value.slice(0,100).flatMap(v=>{if(!v||!['removed','price','terms'].includes(v.kind)||typeof v.id!=='string'||typeof v.name!=='string'||typeof v.englishName!=='string'||v.kind==='price'&&(!Number.isSafeInteger(v.before)||v.before<0||!Number.isSafeInteger(v.after)||v.after<0))return [];return [{kind:v.kind,id:v.id.slice(0,100),name:v.name.slice(0,100),englishName:v.englishName.slice(0,100),...(v.kind==='price'?{before:v.before,after:v.after}:{})}];});}
export function campaignPercent(c:Catalog,now=new Date()){return Math.max(0,...c.campaigns.filter(v=>v.active&&(!v.start||Date.parse(v.start)<=now.getTime())&&(!v.end||Date.parse(v.end)>=now.getTime())).map(v=>v.discount));}
export function cartSnapshot(c:Catalog,cart:Record<string,number>,now=new Date()):CartSnapshot{
 return {products:Object.fromEntries(c.products.filter(p=>cart[p.id]>0).map(p=>[p.id,{name:p.name,englishName:p.english?.name||p.name,price:p.price,eligible:boxEligible(p)}])),bulkPricing:{...c.bulkPricing},campaignPercent:campaignPercent(c,now),deliveryFee:c.settings.deliveryFee,deliveryQuoted:!!c.settings.deliveryQuoted,demo:c.settings.demo};
}
export function cleanCartSnapshot(value:unknown):CartSnapshot|null{
 if(!value||typeof value!=='object')return null;const v=value as CartSnapshot;
 if(!v.products||typeof v.products!=='object'||Array.isArray(v.products)||!v.bulkPricing||!Number.isSafeInteger(v.bulkPricing.minQty)||v.bulkPricing.minQty<1||!Number.isSafeInteger(v.bulkPricing.unitPrice)||v.bulkPricing.unitPrice<0||!Number.isFinite(v.campaignPercent)||v.campaignPercent<0||v.campaignPercent>100||!Number.isSafeInteger(v.deliveryFee)||v.deliveryFee<0||typeof v.deliveryQuoted!=='boolean'||typeof v.demo!=='boolean')return null;
 const products:CartSnapshot['products']=Object.create(null);
 for(const [id,p] of Object.entries(v.products)){if(!p||typeof p.name!=='string'||typeof p.englishName!=='string'||!Number.isSafeInteger(p.price)||p.price<0||typeof p.eligible!=='boolean')return null;products[id]={name:p.name.slice(0,100),englishName:p.englishName.slice(0,100),price:p.price,eligible:p.eligible};}
 return {products,bulkPricing:{minQty:v.bulkPricing.minQty,unitPrice:v.bulkPricing.unitPrice},campaignPercent:v.campaignPercent,deliveryFee:v.deliveryFee,deliveryQuoted:v.deliveryQuoted,demo:v.demo};
}
export function reconcileCart(c:Catalog,value:unknown,previous:CartSnapshot|null,now=new Date()){
 const cart=cleanCart(value),next:Record<string,number>={},changes:CartChange[]=[];
 for(const [id,qty] of Object.entries(cart)){
  const p=c.products.find(p=>p.id===id),old=previous?.products[id];
  if(!p||!productAvailable(p,now)){changes.push({kind:'removed',id,name:old?.name||p?.name||'Seçilen ürün',englishName:old?.englishName||p?.english?.name||p?.name||'Selected product'});continue;}
  next[id]=qty;
  if(old&&old.price!==p.price)changes.push({kind:'price',id,name:p.name,englishName:p.english?.name||p.name,before:old.price,after:p.price});
 }
 const snapshot=cartSnapshot(c,next,now);
 const eligibility=Object.keys(next).some(id=>previous?.products[id]&&previous.products[id].eligible!==snapshot.products[id]?.eligible);
 if(Object.keys(next).length&&previous&&(eligibility||previous.bulkPricing.minQty!==snapshot.bulkPricing.minQty||previous.bulkPricing.unitPrice!==snapshot.bulkPricing.unitPrice||previous.campaignPercent!==snapshot.campaignPercent||previous.deliveryFee!==snapshot.deliveryFee||previous.deliveryQuoted!==snapshot.deliveryQuoted||previous.demo!==snapshot.demo))changes.push({kind:'terms',id:'terms',name:'',englishName:''});
 return {cart:next,changes,snapshot};
}
export function mergeCartChanges(before:CartChange[],after:CartChange[]){const map=new Map(before.map(v=>[v.kind+':'+v.id,v]));for(const item of after){const old=map.get(item.kind+':'+item.id);map.set(item.kind+':'+item.id,item.kind==='price'&&old?{...item,before:old.before}:item);}return [...map.values()];}
// Public pricing expectations only. The server still computes every amount itself.
export function cartQuote(c:Catalog,cart:Record<string,number>,type:string,now=new Date()){
 const snapshot=cartSnapshot(c,cart,now);
 return JSON.stringify({items:Object.entries(snapshot.products).sort(([a],[b])=>a.localeCompare(b)).map(([id,p])=>[id,cart[id],p.price,p.eligible]),bulk:snapshot.bulkPricing,campaign:snapshot.campaignPercent,delivery:type==='Teslimat'?[snapshot.deliveryQuoted,snapshot.deliveryFee]:[false,0],demo:snapshot.demo});
}
