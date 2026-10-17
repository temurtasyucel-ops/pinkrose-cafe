import type {Catalog,Product} from '@/lib/types';
import type {Language} from '@/lib/i18n';
import {localContent} from '@/lib/i18n';
import {basketOffer,boxEligible,seasonalProducts} from '@/lib/pricing';
import styles from './storefront-offers.module.css';
type Common={catalog:Catalog;ready:boolean;language:Language;money:(price:number)=>string};
export function ProductOffer({catalog,ready,language,money,product}:{product:Product}&Common){
 if(!ready||!product.active||!product.stock||!boxEligible(product)||product.price<=catalog.bulkPricing.unitPrice)return null;
 const {minQty,unitPrice}=catalog.bulkPricing;
 return <small className={styles.label+' product-offer'}>{language==='en'?`${minQty} or more: ${money(unitPrice)} / cookie`:`${minQty} adet ve üzeri: ${money(unitPrice)} / adet`}</small>;
}
export function CartOffer({catalog,ready,language,money,cart,onExplore}:Common&{cart:Record<string,number>;onExplore:()=>void}){
 const offer=ready?basketOffer(catalog,cart):null;
 if(!offer)return null;
 const en=language==='en';
 return <div className={styles.cart} role="status" aria-live="polite">
  <strong>{offer.remaining?(en?`Add ${offer.remaining} more ${offer.remaining===1?'cookie':'cookies'} for the quantity discount`:`Adet avantajı için ${offer.remaining} kurabiye daha ekle`):(en?'Quantity discount applied':'Adet avantajı uygulandı')}</strong>
  <p>{offer.remaining?(en?`Eligible varieties: ${money(offer.unitPrice)} each. Mix your favourites.`:`Uygun çeşitler ${money(offer.unitPrice)} / adet. Farklı çeşitleri karıştırabilirsin.`):(en?`You saved ${money(offer.savings)} with the quantity discount.`:`Adet avantajıyla ${money(offer.savings)} kazandın.`)}</p>
  {!!offer.remaining&&<button type="button" className={styles.explore} onClick={onExplore}>{en?'Choose another cookie':'Bir kurabiye daha seç'} ↗</button>}
 </div>;
}
export function SeasonalSpotlight({catalog,ready,language,onInspect}:Omit<Common,'money'>&{onInspect:(product:Product)=>void}){
 const products=ready?seasonalProducts(catalog):[];
 if(!products.length)return null;
 const en=language==='en';
 return <section className={styles.seasonal} aria-label={en?'Seasonal flavours':'Bu sezonun lezzetleri'}><h3>{en?'This season’s flavours':'Bu sezonun lezzetleri'}</h3><div className={styles.seasonalGrid}>{products.map(p=><button type="button" key={p.id} className={styles.seasonalProduct} onClick={()=>onInspect(p)}>{p.image&&<img src={p.image} alt="" loading="lazy"/>}<span><strong>{localContent(p,'name',p.name,language)}</strong><small>{localContent(p,'description',p.description,language)}</small><b>{en?'Explore the flavour':'Lezzeti keşfet'} ↗</b></span></button>)}</div></section>;
}
