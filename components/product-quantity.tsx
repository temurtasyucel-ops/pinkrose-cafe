'use client';
import {Minus,Plus} from 'lucide-react';
import type {Language} from '@/lib/i18n';

export default function ProductQuantity({name,quantity,language,disabled=false,available=true,onAdd,onRemove}:{name:string;quantity:number;language:Language;disabled?:boolean;available?:boolean;onAdd:()=>void;onRemove:()=>void}){
 const en=language==='en';
 if(!quantity)return <button type="button" className="add-button" aria-label={name+(en?' · Add to basket':' · Sepete ekle')} disabled={disabled||!available} onClick={onAdd}><Plus size={18}/><span>{available?(en?'Add to basket':'Sepete ekle'):(en?'Unavailable':'Siparişe kapalı')}</span></button>;
 return <div className="product-quantity" role="group" aria-label={name+(en?' · Basket quantity':' · Sepet adedi')}><button type="button" disabled={disabled} onClick={onRemove} aria-label={name+(en?' · Remove one from basket':' · Sepetten bir azalt')}><Minus size={18}/></button><output aria-live="polite" aria-atomic="true" aria-label={en?`${name}: ${quantity} in basket`:`${name}: sepette ${quantity} adet`}>{quantity}</output><button type="button" disabled={disabled||!available||quantity>=50} onClick={onAdd} aria-label={name+(en?' · Add one to basket':' · Sepete bir ekle')}><Plus size={18}/></button></div>;
}
