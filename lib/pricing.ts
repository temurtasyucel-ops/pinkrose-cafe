import {Catalog} from './types';
// Package prices apply only to the seven cookies from the supplied menu.
export function priceBasket(c:Catalog,items:{id:string;price:number;qty:number}[]){
 const cookies=items.filter(i=>/^cookie-[1-7]$/.test(i.id));
 const qty=cookies.reduce((n,i)=>n+i.qty,0),subtotal=items.reduce((n,i)=>n+i.price*i.qty,0);
 if(!qty)return {subtotal,packageDiscount:0};
 const unit=Math.max(...cookies.map(i=>i.price));
 const best=Array(qty+1).fill(Infinity);best[0]=0;
 for(let n=1;n<=qty;n++){best[n]=best[n-1]+unit;for(const p of c.packages)if(n>=p.qty)best[n]=Math.min(best[n],best[n-p.qty]+p.price);}
 let cookieTotal=Math.min(cookies.reduce((n,i)=>n+i.price*i.qty,0),best[qty]);
 if(cookies.length===7){const sets=Math.min(...cookies.map(i=>i.qty));for(let n=1;n<=sets;n++)cookieTotal=Math.min(cookieTotal,n*c.tastingPrice+best[qty-n*7]);}
 return {subtotal,packageDiscount:Math.max(0,cookies.reduce((n,i)=>n+i.price*i.qty,0)-cookieTotal)};
}
