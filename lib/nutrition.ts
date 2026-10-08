import type {Product} from './types';
const originalCalories:Record<string,number>={'cookie-1':570,'cookie-2':490,'cookie-3':460,'cookie-4':510,'cookie-5':570,'cookie-6':620,'cookie-7':570};
export function validCalories(value:unknown):value is number{return typeof value==='number'&&Number.isInteger(value)&&value>0&&value<=10000;}
export function calorieEstimate(product:Pick<Product,'id'|'calories'>):number|null{
 const value=product.calories===undefined?originalCalories[product.id]:product.calories;
 return validCalories(value)?Math.max(10,Math.round(value/10)*10):null;
}
export function weightRange(weight:string|undefined):[number,number]|null{
 const match=weight?.trim().match(/^(\d+(?:[.,]\d+)?)\s*(?:[–—-]\s*(\d+(?:[.,]\d+)?))?\s*g$/i);
 if(!match)return null;
 const lo=Number(match[1].replace(',','.')),hi=Number((match[2]||match[1]).replace(',','.'));
 return lo>0&&hi>=lo?[lo,hi]:null;
}
export function boxWeight(products:Product[],qty:number):[number,number]|null{
 const eligible=products.filter(p=>p.active&&(p.boxEligible??/^cookie-[1-7]$/.test(p.id)));
 const ranges=eligible.map(p=>weightRange(p.weight));
 if(!eligible.length||ranges.some(r=>!r)||!Number.isInteger(qty)||qty<1)return null;
 return [Math.round(Math.min(...ranges.map(r=>r![0]))*qty),Math.round(Math.max(...ranges.map(r=>r![1]))*qty)];
}
