import type {Catalog} from '@/lib/types';
import type {Language} from '@/lib/i18n';
import {quantityOffer} from '@/lib/pricing';

export default function QuantityBanner({catalog,ready,language,money}:{catalog:Catalog;ready:boolean;language:Language;money:(price:number)=>string}) {
  const offer=ready?quantityOffer(catalog):null;
  if(!offer)return null;
  const en=language==='en';
  const range=(min:number,max:number)=>min===max?money(min):`${money(min)}–${money(max)}`;
  return <section className="quantity-banner" aria-label={en?'Cookie quantity offer':'Kurabiye adet avantajı'}>
    <div className="quantity-banner-copy">
      <strong>{en?'Sweet on its own. Sweeter together!':'Bir tane güzel, birlikte daha tatlı!'}</strong>
      <p>{offer.minQty>1&&<><span>{en?'Single':'Tekli'}: {range(offer.singleMin,offer.singleMax)}</span><span aria-hidden="true"> · </span></>}
        <b>{en?`Buy ${offer.minQty} or more: `:`${offer.minQty} adet ve üzeri: `}{range(offer.discountMin,offer.discountMax)} / {en?'cookie':'adet'}</b>
      </p>
      <small>{en?'Mix your favourites. Applies to box-eligible varieties.':'Çeşitleri dilediğin gibi karıştır. Kutuya dahil çeşitlerde geçerlidir.'}</small>
    </div>
    <a href="#menu" className="quantity-banner-link">{en?'Explore our cookies':'Kurabiyeleri keşfet'} <span aria-hidden="true">↗</span></a>
  </section>;
}
