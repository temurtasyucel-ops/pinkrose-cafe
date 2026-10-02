'use client';

import {useEffect,useState} from 'react';
import {ChevronLeft,ChevronRight,MoveHorizontal} from 'lucide-react';
import {Carousel,CarouselContent,CarouselItem,type CarouselApi} from '@/components/ui/carousel';
import type {Product} from '@/lib/types';

import {Language,translate} from '@/lib/i18n';
export default function ProductGallery({product,tone,onInspect,language='tr'}:{product:Product;tone:number;onInspect:()=>void;language?:Language}){
 const t=(text:string)=>translate(text,language);
 const [api,setApi]=useState<CarouselApi>();
 const [selected,setSelected]=useState(0);
 const photos=[...(product.image?[{src:product.image,label:t("Dış görünüş")}]:[]),...(product.insideImage?[{src:product.insideImage,label:t("İç dolgu")}]:[])];
 const multiple=photos.length>1;
 useEffect(()=>{
  if(!api)return;
  const sync=()=>setSelected(api.selectedScrollSnap());
  sync();api.on('select',sync);api.on('reInit',sync);
  return()=>{api.off('select',sync);api.off('reInit',sync);};
 },[api]);
 return <Carousel className="product-gallery" opts={{loop:false,watchDrag:multiple}} setApi={setApi} aria-label={product.name+t(" fotoğrafları")} tabIndex={multiple?0:undefined}>
  <div className={'product-photo gallery-frame tone-'+tone}>
   {photos.length?<CarouselContent className="gallery-track">{photos.map((photo,i)=><CarouselItem key={photo.src} className="gallery-slide" aria-hidden={i!==selected} aria-label={`${i+1} / ${photos.length} · ${photo.label}`}>
    <button type="button" className="gallery-image-button" onClick={e=>{if(!e.defaultPrevented)onInspect();}} aria-label={product.name+' '+photo.label.toLocaleLowerCase('tr-TR')+t(" fotoğrafı; ürün detayını aç")} tabIndex={i===selected?0:-1}>
     <img src={photo.src} alt={product.name+' · '+photo.label} loading="lazy" draggable={false}/>
    </button>
   </CarouselItem>)}</CarouselContent>:<button className="gallery-image-button gallery-placeholder" type="button" onClick={onInspect} aria-label={product.name+t(" ürününü incele")}><span className="product-initial">{product.name.split(' ').map(w=>w[0]).join('')}</span><small>{t("Fotoğraf yakında")}</small></button>}
   {product.featured&&<span className="badge">{t("Pink Rose seçkisi")}</span>}
   {!product.stock&&<span className="soldout">{t("Tükendi")}</span>}
   {multiple&&<><span className="gallery-count" aria-hidden="true">{selected+1} / {photos.length}</span><button type="button" className="gallery-arrow gallery-prev" aria-label={product.name+t(" dış görünüşünü göster")} onClick={()=>api?.scrollPrev()} disabled={selected===0}><ChevronLeft size={20}/></button><button type="button" className="gallery-arrow gallery-next" aria-label={product.name+t(" iç dolgusunu göster")} onClick={()=>api?.scrollNext()} disabled={selected===photos.length-1}><ChevronRight size={20}/></button></>}
  </div>
  {multiple&&<div className="gallery-caption"><div className="gallery-indicator"><div className="gallery-dots" role="group" aria-label={t("Fotoğraf seç")}>{photos.map((photo,i)=><button type="button" key={photo.src} aria-label={product.name+' · '+photo.label} aria-pressed={selected===i} className={selected===i?'is-selected':''} onClick={()=>api?.scrollTo(i)}><span/></button>)}</div><span aria-live="polite" aria-atomic="true">{photos[selected]?.label}</span></div><p className="gallery-hint"><MoveHorizontal size={16} aria-hidden="true"/>{selected===0?t("İç dolgu için sola kaydır"):t("Dış görünüş için sağa kaydır")}</p></div>}
 </Carousel>;
}
