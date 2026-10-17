import Link from 'next/link';
import type {Catalog} from '@/lib/types';
import type {Language} from '@/lib/i18n';
import {quantityOffer} from '@/lib/pricing';
import styles from './quantity-banner.module.css';

export default function QuantityBanner({catalog,ready,language,money}:{catalog:Catalog;ready:boolean;language:Language;money:(price:number)=>string}) {
  const offer=ready?quantityOffer(catalog):null;
  if(!offer)return null;
  const en=language==='en';
  const range=(min:number,max:number)=>min===max?money(min):`${money(min)}–${money(max)}`;
  return <section className={styles.banner} aria-label={en?'Cookie quantity offer':'Kurabiye adet avantajı'}>
    <div className={styles.copy}>
      <p>{offer.minQty>1&&<><span>{en?'Single':'Tekli'}: {range(offer.singleMin,offer.singleMax)}</span><span aria-hidden="true"> · </span></>}
        <b>{en?`Buy ${offer.minQty} or more: `:`${offer.minQty} adet ve üzeri: `}{range(offer.discountMin,offer.discountMax)} / {en?'cookie':'adet'}</b>
      </p>
      <small>{en?'Mix your favourites. Applies to box-eligible varieties.':'Çeşitleri dilediğin gibi karıştır. Kutuya dahil çeşitlerde geçerlidir.'}</small>
    </div>
    <Link href="/kutunu-olustur" className={styles.link}>{en?'Build your box':'Kutunu oluştur'} <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M7 7h10v10"/></svg></Link>
  </section>;
}
