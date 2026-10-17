import type {Catalog} from './types';
import {cleanCart} from './cart.ts';
import {boxEligible} from './pricing.ts';
import {productAvailable} from './shop-experience.ts';

export const previousBoxKey='pinkrose-previous-box-v1';
// Storage contains product IDs and quantities only, never prices or recipient data.
export function previousBoxSelection(value:unknown){return cleanCart(value);}
export function reviewPreviousBox(c:Catalog,value:unknown,now=new Date()){
 const previous=previousBoxSelection(value),originalCount=Object.values(previous).reduce((n,q)=>n+q,0);
 const sizes=c.packages.map(p=>p.qty).filter(q=>Number.isInteger(q)&&q>0&&q<=50).sort((a,b)=>a-b);
 if(!originalCount||!sizes.length)return null;
 const usable=Object.entries(previous).filter(([id])=>c.products.some(p=>p.id===id&&boxEligible(p)&&productAvailable(p,now)));
 const usableCount=usable.reduce((n,[,q])=>n+q,0);
 const target=sizes.includes(originalCount)?originalCount:(sizes.find(q=>q>=usableCount)??sizes[sizes.length-1]);
 let remaining=target;const selection:Record<string,number>={};
 for(const [id,quantity] of usable){const qty=Math.min(quantity,remaining);if(qty)selection[id]=qty;remaining-=qty;}
 return {target,selection,removedQty:originalCount-Object.values(selection).reduce((n,q)=>n+q,0),changedSize:target!==originalCount};
}
