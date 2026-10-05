import type {Catalog,Product} from './types';
export function boxEligible(p:Product){return p.boxEligible??/^cookie-[1-7]$/.test(p.id);}
export function priceBasket(c:Catalog,items:{id:string;price:number;qty:number}[]){
 const eligible=new Set(c.products.filter(boxEligible).map(p=>p.id));
 const cookies=items.filter(i=>eligible.has(i.id));
 const subtotal=items.reduce((n,i)=>n+i.price*i.qty,0),cookieSubtotal=cookies.reduce((n,i)=>n+i.price*i.qty,0);
 if(!cookies.length)return {subtotal,packageDiscount:0};
 const singles=cookies.flatMap(i=>Array(i.qty).fill(i.price)).sort((a,b)=>a-b);
 const best=Array(singles.length+1).fill(Infinity);best[0]=0;
 for(let n=1;n<=singles.length;n++){
  best[n]=best[n-1]+singles[n-1];
  for(const p of c.packages)if(n>=p.qty)best[n]=Math.min(best[n],best[n-p.qty]+p.price);
 }
 return {subtotal,packageDiscount:Math.max(0,cookieSubtotal-best[singles.length])};
}
