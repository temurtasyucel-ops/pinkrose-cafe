import type {Product} from '@/lib/types';
import {cartWeight} from '@/lib/nutrition';

export default function CartWeight({products,cart,english=false}:{products:Product[];cart:Record<string,number>;english?:boolean}){
 const weight=cartWeight(products,cart);
 if(!weight)return null;
 const {quantity,min,max}=weight;
 const headline=quantity===4&&min>=450&&max<=650?(english?'Around half a kilo of cookie joy':'Yaklaşık yarım kilo cookie keyfi'):quantity===8&&min>=900&&max<=1300?(english?'Around a kilo of happiness':'Yaklaşık bir kilo mutluluk'):null;
 return <div className="cart-weight" role="status" aria-live="polite" aria-atomic="true"><strong>{quantity} {english?'cookies':'kurabiye'} · {english?'approx.':'yaklaşık'} {min===max?min:`${min}–${max}`} g</strong><small>{headline|| (english?'Estimated cookie weight; packaging is excluded.':'Kurabiyelerin yaklaşık toplam gramajı; ambalaj hariçtir.')}</small></div>;
}
