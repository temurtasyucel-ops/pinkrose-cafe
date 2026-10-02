import type {Catalog,Product} from './types';
export const defaultTastingIds=Array.from({length:7},(_,i)=>'cookie-'+(i+1));
export function boxEligible(p:Product){return p.boxEligible??/^cookie-[1-7]$/.test(p.id);}
export function tastingSelection(c:Catalog){
 const ids=c.tastingIds??defaultTastingIds;
 const products=ids.map(id=>c.products.find(p=>p.id===id));
 const available=ids.length===7&&new Set(ids).size===7&&products.every(p=>p&&p.active&&p.stock&&boxEligible(p));
 return {ids,products,available};
}
export function priceBasket(c:Catalog,items:{id:string;price:number;qty:number}[]){
 const eligible=new Set(c.products.filter(boxEligible).map(p=>p.id));
 const cookies=items.filter(i=>eligible.has(i.id));
 const subtotal=items.reduce((n,i)=>n+i.price*i.qty,0),cookieSubtotal=cookies.reduce((n,i)=>n+i.price*i.qty,0);
 if(!cookies.length)return {subtotal,packageDiscount:0};
 const tasting=tastingSelection(c),selected=new Set(tasting.ids);
 function bestPrice(tastingSets=0){
  const singles=cookies.flatMap(i=>Array(Math.max(0,i.qty-(selected.has(i.id)?tastingSets:0))).fill(i.price)).sort((a,b)=>a-b);
  const best=Array(singles.length+1).fill(Infinity);best[0]=0;
  for(let n=1;n<=singles.length;n++){
   best[n]=best[n-1]+singles[n-1];
   for(const p of c.packages)if(n>=p.qty)best[n]=Math.min(best[n],best[n-p.qty]+p.price);
  }
  return tastingSets*c.tastingPrice+best[singles.length];
 }
 let cookieTotal=Math.min(cookieSubtotal,bestPrice());
 if(tasting.available){const sets=Math.min(...tasting.ids.map(id=>cookies.find(i=>i.id===id)?.qty||0));for(let n=1;n<=sets;n++)cookieTotal=Math.min(cookieTotal,bestPrice(n));}
 return {subtotal,packageDiscount:Math.max(0,cookieSubtotal-cookieTotal)};
}
