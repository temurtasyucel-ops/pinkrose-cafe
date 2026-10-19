'use client';
import {useEffect,useState} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {Check,ChevronLeft,ChevronRight} from 'lucide-react';
import type {Catalog} from '@/lib/types';
import type {Language} from '@/lib/i18n';
import styles from './shop-experience.module.css';

export default function ShopReviews({catalog,language}:{catalog:Catalog;language:Language}){
 const reviews=catalog.reviews||[],en=language==='en';
 const [viewport,api]=useEmblaCarousel({align:'start',containScroll:'trimSnaps',loop:false,slidesToScroll:1,breakpoints:{'(prefers-reduced-motion: reduce)':{duration:0}}});
 const [position,setPosition]=useState({index:0,count:0,previous:false,next:false});
 useEffect(()=>{
  if(!api)return;
  const sync=()=>setPosition({index:api.selectedScrollSnap(),count:api.scrollSnapList().length,previous:api.canScrollPrev(),next:api.canScrollNext()});
  sync();api.on('select',sync);api.on('reInit',sync);
  return()=>{api.off('select',sync);api.off('reInit',sync);};
 },[api]);
 if(!reviews.length)return null;
 const multiple=position.count>1;
 return <section className={styles.reviewSection} aria-labelledby="review-title" aria-roledescription={en?'carousel':'kaydırmalı yorumlar'}>
  <span className="eyebrow">{en?'FROM YOUR SWEET BREAKS':'SİZİN TATLI MOLALARINIZDAN'}</span>
  <div className={styles.reviewHeading}><h2 id="review-title">{en?'A few lovely words.':'Sizden gelen güzel sözler.'}</h2>{multiple&&<div className={styles.reviewArrows}><button type="button" aria-label={en?'Previous reviews':'Önceki yorumlar'} aria-controls="review-viewport" disabled={!position.previous} onClick={()=>api?.scrollPrev()}><ChevronLeft size={21}/></button><button type="button" aria-label={en?'Next reviews':'Sonraki yorumlar'} aria-controls="review-viewport" disabled={!position.next} onClick={()=>api?.scrollNext()}><ChevronRight size={21}/></button></div>}</div>
  <div ref={viewport} id="review-viewport" className={styles.reviewViewport} tabIndex={multiple?0:undefined} aria-label={en?'Customer reviews; use the arrow keys to browse':'Müşteri yorumları; ok tuşlarıyla gezinebilirsin'} onKeyDown={e=>{
   if(!api||!multiple)return;
   if(e.key==='ArrowLeft'){e.preventDefault();api.scrollPrev();}
   if(e.key==='ArrowRight'){e.preventDefault();api.scrollNext();}
   if(e.key==='Home'){e.preventDefault();api.scrollTo(0);}
   if(e.key==='End'){e.preventDefault();api.scrollTo(position.count-1);}
  }}>
   <div className={styles.reviews}>{reviews.map((r,index)=><div className={styles.reviewSlide} key={r.id} role="group" aria-roledescription={en?'slide':'yorum'} aria-label={`${index+1} / ${reviews.length}`}><figure><span aria-label={`${r.rating}/5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span><blockquote>{r.text}</blockquote><figcaption>{r.name}<small><Check size={14}/>{en?'Verified delivered order':'Doğrulanmış, teslim edilmiş sipariş'}</small></figcaption></figure></div>)}</div>
  </div>
  {multiple&&<div className={styles.reviewNavigation}><p className={styles.reviewHint}>{en?'Swipe or use the arrows to read more':'Diğer yorumlar için kaydır veya okları kullan'}</p><div className={styles.reviewDots} role="group" aria-label={en?'Choose review position':'Yorum konumunu seç'}>{Array.from({length:position.count},(_,index)=><button type="button" key={index} aria-label={en?`Review position ${index+1}`:`Yorum konumu ${index+1}`} aria-controls="review-viewport" aria-pressed={position.index===index} onClick={()=>api?.scrollTo(index)}><span/></button>)}</div><span className={styles.reviewPosition} aria-live="polite" aria-atomic="true">{en?'Position':'Konum'} {position.index+1} / {position.count}</span></div>}
 </section>;
}
