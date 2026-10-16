import type {Catalog,Product,Order} from './types';
import {priceBasket,boxEligible} from './pricing';

export const flavourDefaults:Record<string,string>={
 'cookie-1':'Beyaz çikolata · Ceviz','cookie-2':'Beyaz çikolata · Kakaolu hamur',
 'cookie-3':'Bitter çikolata · Vişne','cookie-4':'Raffaello · Hindistan cevizi',
 'cookie-5':'İki renkli hamur · Ferrero Rocher','cookie-6':'Nutella · Fındık',
 'cookie-7':'Nutella · Çıtır Nesquik','cookie-8':'Beyaz çikolata · Limon',
 'cookie-9':'Elma · Tarçın · Ceviz'
};
export const flavourEnglish:Record<string,string>={
 'Beyaz çikolata · Ceviz':'White chocolate · Walnut','Beyaz çikolata · Kakaolu hamur':'White chocolate · Cocoa dough',
 'Bitter çikolata · Vişne':'Dark chocolate · Sour cherry','Raffaello · Hindistan cevizi':'Raffaello · Coconut',
 'İki renkli hamur · Ferrero Rocher':'Two-tone dough · Ferrero Rocher','Nutella · Fındık':'Nutella · Hazelnut',
 'Nutella · Çıtır Nesquik':'Nutella · Crunchy Nesquik','Beyaz çikolata · Limon':'White chocolate · Lemon',
 'Elma · Tarçın · Ceviz':'Apple · Cinnamon · Walnut'
};
export function turkeyDate(now=new Date()){
 return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function validLastOrderDate(value:unknown):value is string{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function productAvailable(p:Product,now=new Date()){
 return p.active&&p.stock&&(!p.lastOrderDate||!validLastOrderDate(p.lastOrderDate)||p.lastOrderDate>=turkeyDate(now));
}
export function boxSelection(c:Catalog,selection:Record<string,number>,target:number){
 const items=Object.entries(selection).filter(([,qty])=>qty>0).map(([id,qty])=>{
  const product=c.products.find(p=>p.id===id);
  if(!product||!productAvailable(product)||!boxEligible(product)||!Number.isInteger(qty)||qty>50)throw Error('Kutu seçimini güncelleyin.');
  return {id,qty,price:product.price};
 });
 const count=items.reduce((n,p)=>n+p.qty,0);
 if(!Number.isInteger(target)||target<1||target>50||count>target)throw Error('Kutu adedini kontrol edin.');
 const priced=priceBasket(c,items);
 return {items,count,remaining:target-count,total:priced.subtotal-priced.packageDiscount,complete:count===target};
}
export type GiftDetails={recipient:string;phone:string;message:string};
export function cleanGift(value:unknown):GiftDetails|undefined{
 if(value===undefined||value===null)return undefined;
 if(typeof value!=='object')throw Error('Hediye bilgilerini kontrol edin.');
 const v=value as Record<string,unknown>;
 const recipient=typeof v.recipient==='string'?v.recipient.trim():'';
 const phone=typeof v.phone==='string'?v.phone.replace(/\D/g,''):'';
 const message=typeof v.message==='string'?v.message.trim():'';
 if(recipient.length<2||recipient.length>100||message.length>300||(phone&&!/^(0?5\d{9}|905\d{9})$/.test(phone)))throw Error('Hediye alıcısını, telefonunu ve en fazla 300 karakterlik notunu kontrol edin.');
 return {recipient,phone,message};
}
