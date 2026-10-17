'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Plus,Minus,Gift,Package,Check,ArrowRight} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import type {Catalog,Product} from '@/lib/types';
import type {Language} from '@/lib/i18n';
import type {InsightEvent} from '@/lib/shop-insights';
import {localContent} from '@/lib/i18n';
import {boxSelection,flavourEnglish,productAvailable} from '@/lib/shop-experience';
import {boxEligible,boxPriceRange} from '@/lib/pricing';
import {boxWeight} from '@/lib/nutrition';
import {earliestOrderDate,leadDays} from '@/lib/order-date';
import {reviewPreviousBox} from '@/lib/previous-box';
import {readJson} from '@/lib/http';
import styles from './shop-experience.module.css';

export function trackShop(event:InsightEvent,productId?:string,quantity=1){
 // No customer, phone, address, cookie or visitor identifier is sent.
 if(typeof navigator==='undefined'||navigator.doNotTrack==='1')return;
 void fetch('/api/insights',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,productId,quantity}),keepalive:true}).catch(()=>{});
}
export function FlavourNotes({product,language}:{product:Product;language:Language}){
 const text=product.flavourNotes?.trim();if(!text)return null;
 const label=language==='en'?product.english?.flavourNotes||flavourEnglish[text]||text:text;
 return <p className={styles.flavours+' product-flavours'}>{label}</p>;
}
export function ProductLabels({product,language}:{product:Product;language:Language}){
 const en=language==='en';
 return <div className={styles.labels}>{product.isNew&&<span>{en?'New':'Yeni'}</span>}{product.seasonal&&<span>{en?'Seasonal':'Sezonluk'}</span>}{product.lastOrderDate&&<span>{en?'Last order date: ':'Son sipariş: '}{new Intl.DateTimeFormat(en?'en-GB':'tr-TR',{day:'numeric',month:'short',timeZone:'Europe/Istanbul'}).format(new Date(product.lastOrderDate+'T12:00:00Z'))}</span>}</div>;
}

export function BoxBuilder({catalog,ready,language,money,onAdd,previous,onForget,onRefresh}:{catalog:Catalog;ready:boolean;language:Language;money:(n:number)=>string;onAdd:(selection:Record<string,number>)=>boolean;previous?:Record<string,number>;onForget?:()=>void;onRefresh?:()=>Promise<Catalog|null>}){
 const en=language==='en';
 const [target,setTarget]=useState<number|null>(null),[selection,setSelection]=useState<Record<string,number>>({}),[error,setError]=useState('');
 const completed=useRef(false);
 const prior=reviewPreviousBox(catalog,previous),[reviewNote,setReviewNote]=useState(''),[refreshing,setRefreshing]=useState(false);
 const products=catalog.products.filter(p=>productAvailable(p)&&boxEligible(p));
 const current=useRef({selection,target});current.current={selection,target};
 useEffect(()=>{if(!target)return;
  const hidden=()=>{const s=current.current;if(document.visibilityState==='hidden'&&!completed.current&&s.target&&Object.values(s.selection).some(q=>q>0)){trackShop('box_abandon');completed.current=true;}};
  document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden);
 },[target]);
 const start=(qty:number)=>{completed.current=false;setTarget(qty);setSelection({});setError('');setReviewNote('');trackShop('box_open');};
 const close=()=>{if(!completed.current&&Object.values(selection).some(q=>q>0))trackShop('box_abandon');setTarget(null);};
 async function repeat(){
  if(refreshing)return;setRefreshing(true);setError('');
  try{const fresh=onRefresh?await onRefresh():catalog;if(!fresh)throw Error();const review=reviewPreviousBox(fresh,previous);
   if(fresh.settings.ordersPaused||!review||!fresh.products.some(p=>productAvailable(p)&&boxEligible(p))){setError(en?'There are no available box selections at the moment.':'Şu an uygun bir kutu seçimi bulunmuyor.');return;}
   completed.current=false;setTarget(review.target);setSelection(review.selection);setReviewNote(review.removedQty||review.changedSize?(en?'Some flavours or the box size have changed. Review the selection and fill any empty places.':'Bazı çeşitler veya kutu boyutu değişmiş. Seçimlerini kontrol edip boş kalan yerleri tamamla.'):'');trackShop('box_open');
  }catch{setError(en?'Current prices could not be loaded. Please try again.':'Güncel fiyatlar yüklenemedi. Lütfen tekrar dene.');}finally{setRefreshing(false);}
 }

 let box:ReturnType<typeof boxSelection>|null=null;
 try{if(target)box=boxSelection(catalog,selection,target);}catch{/* A product may have changed while selecting. */}
 const selectionInvalid=target!==null&&!box;
 const change=(id:string,delta:number)=>{setError('');completed.current=false;setSelection(s=>{const count=Object.values(s).reduce((n,q)=>n+q,0);if(delta>0&&count>=(target||0))return s;return {...s,[id]:Math.max(0,(s[id]||0)+delta)};});};
 return <section className={styles.boxSection} id="kutunu-olustur" aria-labelledby="box-title"><span id="paketler" className={styles.anchor} aria-hidden="true"/><div className={styles.boxHeading}><div><h2 id="box-title">{en?'Build a box':'Kutu oluştur'}</h2><p>{en?'Choose a size and mix your flavours.':'Boyunu seç, çeşitleri karıştır.'}</p></div><Package size={30}/></div><div className={styles.boxSizes}>{catalog.packages.map(p=>{const weight=boxWeight(products,p.qty),price=boxPriceRange(catalog,p.qty);return <button key={p.qty} type="button" aria-label={localContent(p,'name',p.name,language)+(en?' · Choose flavours':' · Çeşitleri seç')} title={localContent(p,'name',p.name,language)} disabled={!ready||catalog.settings.ordersPaused||!products.length} onClick={()=>start(p.qty)}><span>{p.qty}{en?' cookies':' adet'}</span>{price&&<><strong>{money(price.min)}{price.min!==price.max?'–'+money(price.max):''}</strong><small>{en?'Per cookie: ':'Adet: '}{money(price.unitMin)}{price.unitMin!==price.unitMax?'–'+money(price.unitMax):''}</small></>}{weight&&<small>≈ {weight[0]===weight[1]?weight[0]:`${weight[0]}–${weight[1]}`} g</small>}</button>;})}</div>
 {prior&&<div className={styles.previousBox}><div><b>{en?'Your last box selection':'Son kutu seçimin'}</b><p>{en?'Saved on this device. Review current flavours and prices before adding.':'Bu cihazdaki son seçimin. Eklemeden önce güncel çeşitleri ve fiyatı kontrol et.'}</p></div><button type="button" className="outline-button" disabled={!ready||refreshing||!!catalog.settings.ordersPaused||!products.length} onClick={repeat}>{refreshing?(en?'Updating…':'Güncelleniyor…'):(en?'Rebuild my last box':'Son kutumu yeniden oluştur')}</button>{onForget&&<button type="button" className="text-link" onClick={onForget}>{en?'Forget selection':'Seçimi unut'}</button>}</div>}
 {error&&target===null&&<p className={styles.note} role="alert">{error}</p>}
 <Dialog open={target!==null} onOpenChange={o=>!o&&close()}><DialogContent className={styles.builder}><DialogTitle>{en?`Build your ${target}-cookie box`:`Kutunu oluştur · ${target} adet`}</DialogTitle><DialogDescription>{en?'Select each flavour and quantity. You can choose a flavour more than once.':'Her çeşitten istediğin adedi seç. Aynı çeşidi birden fazla ekleyebilirsin.'}</DialogDescription>{reviewNote&&<p className={styles.note} role="status">{reviewNote}</p>}<div className={styles.boxProgress} role="status">{box?.count??0} / {target} {en?'selected':'seçildi'}<progress max={target||1} value={box?.count||0}/></div><div className={styles.boxProducts}>{products.map(p=><div key={p.id} className={styles.boxProduct}>{p.image?<img src={p.image} alt=""/>:<span className={styles.initial}>{p.name[0]}</span>}<div><b>{localContent(p,'name',p.name,language)}</b><FlavourNotes product={p} language={language}/><small>{money(p.price)} · {p.weight}</small></div><div className={styles.counter}><button type="button" aria-label={p.name+(en?' decrease':' azalt')} disabled={!selection[p.id]} onClick={()=>change(p.id,-1)}><Minus size={16}/></button><span>{selection[p.id]||0}</span><button type="button" aria-label={p.name+(en?' increase':' artır')} disabled={!box||box.remaining===0} onClick={()=>change(p.id,1)}><Plus size={16}/></button></div></div>)}</div>
 <div className={styles.chosen}>{Object.entries(selection).filter(([,q])=>q>0).map(([id,q])=>{const p=catalog.products.find(p=>p.id===id);return <span key={id}>{p?.image&&<img src={p.image} alt=""/>}{q} × {p?localContent(p,'name',p.name,language):id}</span>;})}</div>
 {selectionInvalid&&<p role="alert">{en?'An item has changed. Reset your selection to continue.':'Bir ürün değişti. Devam etmek için seçimini sıfırla.'}</p>}{error&&<p role="alert">{error}</p>}
 <div className={styles.builderFooter}><div><small>{en?'Products, delivery excluded':'Ürün toplamı, teslimat hariç'}</small><strong>{box?money(box.total):'—'}</strong></div><button type="button" className="button" disabled={!box?.complete||!ready||!!catalog.settings.ordersPaused} onClick={()=>{if(!box?.complete)return;try{if(onAdd(selection)){completed.current=true;trackShop('box_complete',undefined,target||1);setTarget(null);}}catch{setError(en?'Review your quantities.':'Adetleri kontrol et.');}}}>{box?.complete?(en?'Add box to basket':'Kutuyu sepete ekle'):(en?`Choose ${box?.remaining??target} more`:`${box?.remaining??target} ürün daha seç`)}</button></div><p className={styles.note}>{en?'Any additional campaign discount is applied in your basket.':'Varsa ek kampanya indirimi sepette uygulanır.'}</p><button type="button" className="text-link" onClick={()=>setSelection({})}>{en?'Reset selection':'Seçimi sıfırla'}</button></DialogContent></Dialog></section>;
}

export function GiftFields({language,checked,onChange}:{language:Language;checked:boolean;onChange:(v:boolean)=>void}){
 const en=language==='en';
 return <fieldset className={styles.gift}><legend><Gift size={18}/>{en?'A sweet gift':'Tatlı bir hediye'}</legend><label className={styles.check}><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>{en?'I am sending this as a gift':'Hediye gönderiyorum'}</label>{checked&&<><label>{en?'Recipient name':'Alıcının adı soyadı'}<input name="recipient" required minLength={2} maxLength={100} autoComplete="off"/></label><label>{en?'Recipient phone (optional)':'Alıcı telefonu (isteğe bağlı)'}<input name="recipientPhone" type="tel" maxLength={25} autoComplete="off"/></label><label>{en?'Gift card message (optional)':'Hediye kartı notu (isteğe bağlı)'}<textarea name="giftMessage" maxLength={300}/></label><p>{en?'Your card note is saved with the order. We will confirm the presentation and delivery on WhatsApp.':'Kart notun siparişle birlikte kaydedilir. Sunumu ve teslimatı WhatsApp üzerinden netleştiririz.'}</p></>}</fieldset>;
}

export function ShopReviews({catalog,language}:{catalog:Catalog;language:Language}){
 const reviews=(catalog.reviews||[]).slice(0,3);if(!reviews.length)return null;
 const en=language==='en';return <section className={styles.reviewSection} aria-labelledby="review-title"><span className="eyebrow">{en?'FROM YOUR SWEET BREAKS':'SİZİN TATLI MOLALARINIZDAN'}</span><h2 id="review-title">{en?'A few lovely words.':'Sizden gelen güzel sözler.'}</h2><div className={styles.reviews}>{reviews.map(r=><figure key={r.id}><span aria-label={`${r.rating}/5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span><blockquote>{r.text}</blockquote><figcaption>{r.name}<small><Check size={14}/>{en?'Verified delivered order':'Doğrulanmış, teslim edilmiş sipariş'}</small></figcaption></figure>)}</div></section>;
}

export function GroupOrders({catalog,ready,language,expanded=false,occasion,onOccasionChange}:{catalog:Catalog;ready:boolean;language:Language;expanded?:boolean;occasion?:string;onOccasionChange?:(value:string)=>void}){
 const [chosenOccasion,setChosenOccasion]=useState(occasion||'Ofis / kurumsal');
 const en=language==='en';const [busy,setBusy]=useState(false),[success,setSuccess]=useState(false),[error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;const f=new FormData(e.currentTarget);setBusy(true);setError('');try{await readJson(await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(f))}));setSuccess(true);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const body=<div className={styles.groupContent}><p>{en?'For office treats, birthdays and events with 10 cookies or more, tell us your plans. We will discuss the flavours, date and price together.':'Ofis ikramı, doğum günü ve etkinlikler için 10 adet ve üzeri talebini paylaş. Çeşitleri, tarihi ve fiyatı birlikte netleştirelim.'}</p>{success?<div className="notice" role="status">{en?'Your enquiry is saved. Pink Rose will contact you; this is not a confirmed order.':'Talebin kaydedildi. Pink Rose seninle iletişime geçecek; bu işlem kesinleşmiş sipariş değildir.'}</div>:<div className={styles.groupForm}><form onSubmit={submit}><div className={styles.formGrid}><label>{en?'Your name':'Ad soyad'}<input name="customer" required minLength={2} maxLength={100} autoComplete="name"/></label><label>{en?'Mobile phone':'Cep telefonu'}<input name="phone" type="tel" required maxLength={25} autoComplete="tel"/></label><label>{en?'Occasion':'Etkinlik türü'}<select name="occasion" value={occasion??chosenOccasion} onChange={e=>{setChosenOccasion(e.target.value);onOccasionChange?.(e.target.value);}}>{['Ofis / kurumsal','Doğum günü','Etkinlik / davet','Diğer'].map((v,i)=><option key={v} value={v}>{en?['Office / corporate','Birthday','Event / celebration','Other'][i]:v}</option>)}</select></label><label>{en?'Approximate cookie quantity':'Yaklaşık kurabiye adedi'}<input name="quantity" type="number" min={10} max={10000} required step={1}/></label><label>{en?'Preferred date (optional)':'Tercih edilen tarih (isteğe bağlı)'}<input name="date" type="date" min={earliestOrderDate(leadDays(catalog.settings))}/></label></div><label>{en?'What do you have in mind?':'Aklındaki detaylar'}<textarea name="note" maxLength={500}/></label><div className={styles.honeypot} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><p className={styles.note}>{en?'Your details are used to discuss this enquiry. Price and availability are confirmed together.':'Bilgilerin bu talep için iletişimde kullanılır. Fiyat ve uygunluk görüşme sonrasında kesinleşir.'}</p>{error&&<p role="alert">{en?'Please check your details or try again later.':error}</p>}<button className="button" disabled={!ready||busy||catalog.settings.demo||catalog.settings.ordersPaused}>{busy?(en?'Saving…':'Kaydediliyor…'):(en?'Send enquiry':'Talebimi ilet')}</button></form></div>}</div>;
 return expanded?<section className={styles.groupSection} id="ozel-siparis" aria-label={en?'Event enquiry':'Etkinlik talep formu'}>{body}</section>:<details className={styles.groupSection} id="ozel-siparis"><summary><Gift size={18}/><span>{en?'Group and event orders':'Toplu ve etkinlik siparişi'}<small>{en?'For 10 cookies or more':'10 adet ve üzeri talepler için'}</small></span><ArrowRight size={18}/></summary>{body}</details>;
}
