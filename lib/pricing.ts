import type {Catalog} from './types';
// Cookie boxes may contain any mix of the seven menu varieties.
export function priceBasket(c:Catalog,items:{id:string;price:number;qty:number}[]){
 const cookies=items.filter(i=>/^cookie-[1-7]$/.test(i.id));
 const subtotal=items.reduce((n,i)=>n+i.price*i.qty,0),cookieSubtotal=cookies.reduce((n,i)=>n+i.price*i.qty,0);
 if(!cookies.length)return {subtotal,packageDiscount:0};
 function bestPrice(tastingSets=0){
  const singles=cookies.flatMap(i=>Array(Math.max(0,i.qty-tastingSets)).fill(i.price)).sort((a,b)=>a-b);
  const best=Array(singles.length+1).fill(Infinity);best[0]=0;
  for(let n=1;n<=singles.length;n++){
   best[n]=best[n-1]+singles[n-1];
   for(const p of c.packages)if(n>=p.qty)best[n]=Math.min(best[n],best[n-p.qty]+p.price);
  }
  return tastingSets*c.tastingPrice+best[singles.length];
 }
 let cookieTotal=Math.min(cookieSubtotal,bestPrice());
 if(cookies.length===7){const sets=Math.min(...cookies.map(i=>i.qty));for(let n=1;n<=sets;n++)cookieTotal=Math.min(cookieTotal,bestPrice(n));}
 return {subtotal,packageDiscount:Math.max(0,cookieSubtotal-cookieTotal)};
}
