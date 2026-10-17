'use client';
import {Plus,Minus} from 'lucide-react';
import type {Catalog} from '@/lib/types';
import {basketLines} from '@/lib/pricing';
import {localContent,type Language} from '@/lib/i18n';
import {productAvailable} from '@/lib/shop-experience';

export default function BasketItems({catalog,cart,language,money,busy,ready,onIncrease,onDecrease}:{catalog:Catalog;cart:Record<string,number>;language:Language;money:(n:number)=>string;busy:boolean;ready:boolean;onIncrease:(id:string)=>void;onDecrease:(id:string)=>void}){
 const en=language==='en',products=catalog.products.filter(p=>cart[p.id]>0),lines=basketLines(catalog,products.map(p=>({id:p.id,price:p.price,qty:cart[p.id]})));
 return <div className="cart-items">{products.map((p,index)=>{const line=lines[index],name=localContent(p,'name',p.name,language);return <div className="cart-item" key={p.id}><div className="cart-item-copy"><h4>{name}</h4><p className="cart-unit-price">{line.unitPrice<line.price&&<del>{money(line.price)}</del>}<span>{money(line.unitPrice)} / {en?'each':'adet'}</span></p><b className="cart-line-total">{en?'Line total':'Satır toplamı'}: {money(line.lineTotal)}</b></div><div className="quantity"><button type="button" disabled={busy} aria-label={name+(en?' decrease quantity':' azalt')} onClick={()=>onDecrease(p.id)}><Minus size={16}/></button><span aria-live="polite" aria-atomic="true">{line.qty}</span><button type="button" aria-label={name+(en?' increase quantity':' artır')} disabled={busy||!ready||!!catalog.settings.ordersPaused||!productAvailable(p)||line.qty>=50} onClick={()=>onIncrease(p.id)}><Plus size={16}/></button></div></div>;})}</div>;
}
