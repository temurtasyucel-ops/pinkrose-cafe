import {useState} from 'react';
import type {Order} from '@/lib/types';
import {dayInIstanbul,deliveryBuckets,productionPlan,productionText,scheduleLabel} from '@/lib/order-planning';
import styles from './order-planner.module.css';
export default function OrderPlanner({orders,onOpen}:{orders:Order[];onOpen:(order:Order)=>void}){
 const [bucket,setBucket]=useState<keyof ReturnType<typeof deliveryBuckets>>('today');
 const [day,setDay]=useState(()=>dayInIstanbul()),[copy,setCopy]=useState(false),[copyError,setCopyError]=useState(false);
 const buckets=deliveryBuckets(orders),plan=productionPlan(orders,day);
 const names={overdue:'Geçmişte kalan',today:'Bugün',tomorrow:'Yarın',later:'Sonraki günler',undated:'Tarih atanmadı'};
 async function copyPlan(){try{await navigator.clipboard.writeText(productionText(orders,day));setCopy(true);setCopyError(false);}catch{setCopyError(true);}}
 return <section className={styles.planner} aria-labelledby="delivery-planner-title">
  <h3 id="delivery-planner-title">Yaklaşan teslimatlar</h3><p>Kesin teslim zamanına göre açık canlı siparişler. Müşterinin tarih tercihi otomatik olarak kesinleştirilmez.</p>
  <div className={styles.buckets}>{(Object.keys(names) as (keyof typeof names)[]).map(key=><button type="button" key={key} aria-pressed={bucket===key} onClick={()=>setBucket(key)}><span>{names[key]}</span><strong>{buckets[key].length}</strong></button>)}</div>
  <div className={styles.list} aria-live="polite"><h4>{names[bucket]}</h4>{buckets[bucket].length?buckets[bucket].map(o=><button type="button" key={o.id} onClick={()=>onOpen(o)}><span><b>{o.number} · {o.customer}</b><small>{scheduleLabel(o.confirmedAt)||'Kesin teslim zamanı bekleniyor'} · {o.type}{o.city&&' / '+o.city}</small></span><span>{o.status} ↗</span></button>):<p>Bu grupta açık canlı sipariş yok.</p>}</div>
  <div className={styles.production}><div className={styles.heading}><h3>Günlük üretim özeti</h3><label>Üretim için teslim günü<input type="date" required value={day} onChange={e=>{if(e.target.value){setDay(e.target.value);setCopy(false);setCopyError(false);}}}/></label></div>
   <p>“Ödeme alındı” ve “Hazırlanıyor” durumundaki, bu gün için kesinleşmiş siparişler. Deneme, iptal ve teslim edilmiş siparişler dahil değildir.</p>
   {plan.unpaid>0&&<p className={styles.warning}>{plan.unpaid} siparişin teslim günü atanmış ancak ödeme kontrolü tamamlanmamış; üretim toplamına eklenmedi.</p>}
   {plan.undatedPaid>0&&<p className={styles.warning}>Ödemesi kontrol edilmiş {plan.undatedPaid} siparişin kesin teslim günü yok. Sipariş detayından tarih atayın.</p>}
   {plan.items.length?<><div className={styles.counts}>{plan.items.map(p=><div key={p.id}><span>{p.name}</span><b>{p.qty} adet</b></div>)}</div><strong className={styles.total}>{plan.total} adet · {plan.orders.length} sipariş</strong><button type="button" className={styles.copy} onClick={copyPlan}>{copy?'Üretim özeti kopyalandı':'Üretim özetini kopyala'}</button>{copyError&&<label>Üretim özeti<textarea readOnly value={productionText(orders,day)} onFocus={e=>e.target.select()}/></label>}</>:<p>Bu gün için üretime alınabilecek sipariş yok.</p>}
  </div><p className={styles.limit}>Son 500 sipariş üzerinden hesaplanır. Yeni kayıtlar Siparişler sekmesinde 30 saniyede bir yenilenir.</p>
 </section>;
}
