import type {Catalog} from '@/lib/types';
import type {Language} from '@/lib/i18n';
import {localContent} from '@/lib/i18n';
import {earliestOrderDate,leadDays} from '@/lib/order-date';
import styles from './order-guidance.module.css';
export function DatePreference({catalog,language}:{catalog:Catalog;language:Language}){
 const en=language==='en',days=leadDays(catalog.settings),min=earliestOrderDate(days);
 return <fieldset className={styles.dates}><legend>{en?'Preferred date and time':'Tarih ve saat tercihi'}</legend><div className={styles.dateFields}><label>{en?'Date (optional)':'Tarih (isteğe bağlı)'}<input type="date" name="preferredDate" min={min}/></label><label>{en?'Time (optional)':'Saat (isteğe bağlı)'}<input type="time" name="preferredTime"/></label></div><p>{en?(days?`Please order at least ${days} ${days===1?'day':'days'} ahead. We will confirm the date and time on WhatsApp.`:'Choose your preferred date and time; we will confirm availability on WhatsApp.'):(days?`En az ${days} gün önceden sipariş verebilirsin. Kesin gün ve saati WhatsApp üzerinden birlikte netleştirelim.`:'Tarih ve saat tercihini seç; uygunluğu WhatsApp üzerinden birlikte netleştirelim.')}</p></fieldset>;
}
export function OrderQuestions({catalog,ready,language}:{catalog:Catalog;ready:boolean;language:Language}){
 if(!ready)return null;
 const en=language==='en',settings=catalog.settings,days=leadDays(settings);
 const value=(key:keyof typeof settings)=>localContent(settings,key,String(settings[key]||''),language);
 const pickup=value('pickupAddress')||(en?'Manisa Yunusemre: Akgedik or Keçiliköy OSB. The location and time are arranged on WhatsApp according to the day.':'Manisa Yunusemre: Akgedik veya Keçiliköy OSB. Güne göre konum ve saat WhatsApp üzerinden birlikte belirlenir.');
 const questions=[
  {q:en?'How far ahead should I order?':'Kaç gün önceden sipariş vermeliyim?',a:value('preparationText')||(en?(days?`Please order at least ${days} ${days===1?'day':'days'} in advance. Your chosen date and time are preferences; we confirm availability together on WhatsApp.`:'Choose your preferred date and time; we will confirm availability on WhatsApp.'):(days?`Siparişini en az ${days} gün önceden oluştur. Seçtiğin tarih ve saat bir tercihtir; uygunluğu WhatsApp üzerinden birlikte netleştiriyoruz.`:'Tarih ve saat tercihini seç; uygunluğu WhatsApp üzerinden birlikte netleştirelim.'))},
  {q:en?'How do I pay?':'Ödemeyi nasıl yapabilirim?',a:settings.demo?(en?'Preview mode is active. Test orders do not require payment.':'Şu an deneme modu açık. Deneme siparişlerinde ödeme alınmaz.'):(value('paymentText')||(en?'We share the final total and IBAN on WhatsApp. Preparation begins once payment is received and verified.':'Kesin toplamı ve IBAN bilgilerini WhatsApp üzerinden paylaşıyoruz. Ödeme hesabımıza ulaşıp kontrol edildikten sonra hazırlığa başlıyoruz.'))},
  {q:en?'Can I collect or request delivery?':'Gel-al veya teslimat seçebilir miyim?',a:[value('deliveryText'),(en?'Collection point: ':'Gel-al noktası: ')+pickup,value('pickupHours')].filter(Boolean).join('\n\n'),delivery:true},
  {q:en?'Can I mix different flavours?':'Farklı çeşitleri karıştırabilir miyim?',a:en?`Yes. Box-eligible varieties count together towards the ${catalog.bulkPricing.minQty}-cookie quantity discount. Any lower individual price is preserved.`:`Evet. Kutuya dahil çeşitler, ${catalog.bulkPricing.minQty} adetlik avantaj koşuluna birlikte sayılır. Tekli fiyatı daha düşük olan ürünün fiyatı yükseltilmez.`},
  {q:en?'Where can I find ingredients and allergens?':'İçerik ve alerjen bilgilerine nereden bakabilirim?',a:en?'Open a product to see its ingredients and allergens. Contact us before ordering if you have an allergy.':'Ürüne dokunarak içerik ve alerjen bilgilerini görebilirsin. Alerjin varsa sipariş öncesinde bizimle iletişime geç.'},
  {q:en?'How should I store my cookies?':'Kurabiyeleri nasıl saklamalıyım?',a:value('storageInfo')},
  {q:en?'How can I warm my cookies?':'Kurabiyeleri nasıl ısıtabilirim?',a:value('heatingInfo')}
 ].filter(item=>item.a);
 return <section className={styles.faq} aria-labelledby="order-questions"><span className={styles.eyebrow}>{en?'BEFORE YOUR SWEET BREAK':'TATLI MOLANDAN ÖNCE'}</span><h2 id="order-questions">{en?'A few things to know':'Aklındaki sorular'}</h2>{questions.map(item=><details key={item.q}><summary>{item.q}</summary><p>{item.a}</p>{'delivery' in item&&settings.pickupMapUrl&&<a className={styles.detailLink} href={settings.pickupMapUrl} target="_blank" rel="noreferrer">{en?'Open location':'Konumu aç'}</a>}</details>)}</section>;
}
