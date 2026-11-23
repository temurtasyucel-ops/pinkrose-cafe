'use client';

import {useMemo,useState, type FormEvent} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import ProductGallery from '@/components/product-gallery';
import ProductNutrition from '@/components/product-nutrition';
import {FlavourNotes,ProductLabels} from '@/components/shop-experience';
import {productPath} from '@/lib/storefront-pages';
import type {Campaign,Product} from '@/lib/types';
import {campaignPricing} from '@/lib/campaign-pricing';
import {readJson} from '@/lib/http';

const money=(value:number)=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(value/100);

export default function CampaignStorefront({campaign,products,whatsapp}:{campaign:Campaign;products:Product[];whatsapp:string}){
  const router=useRouter();
  const [quantities,setQuantities]=useState<Record<string,number>>({});
  const [eventOrder,setEventOrder]=useState(false);
  const [customer,setCustomer]=useState('');
  const [phone,setPhone]=useState('');
  const [vestelSicilNo,setVestelSicilNo]=useState('');
  const [preferredDate,setPreferredDate]=useState('');
  const [note,setNote]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [success,setSuccess]=useState<{number:string;total:number;whatsappMessage?:string}|null>(null);
  const selected=products.filter(p=>(quantities[p.id]||0)>0);
  const quoteState=useMemo(()=>{try{return {quote:campaignPricing(campaign,products,quantities,eventOrder),error:''};}catch(error){return {quote:null,error:error instanceof Error?error.message:'Fiyat hesaplanamadı. Sayfayı yenileyip tekrar deneyin.'};}},[campaign,products,quantities,eventOrder]);
  const quote=quoteState.quote;
  const config=campaign.pricing;
  const packages=config?.packages||[{qty:2,price:30000},{qty:4,price:60000},{qty:6,price:80000},{qty:8,price:100000}];
  const single=config?.singleItemPrice??15000;
  const eventMin=config?.eventMinQty??8;
  function change(id:string,delta:number){
    setQuantities(old=>{const next={...old},value=(old[id]||0)+delta;if(value<=0)delete next[id];else if(value<=50)next[id]=value;return next;});
  }
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!quote||busy)return;
    setBusy(true);setMessage('');
    try{
      const key=crypto.randomUUID();
      const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        key,campaignSlug:campaign.slug||'vestel',eventOrder,customer,phone,vestelSicilNo,type:'Gel-al',address:'',note,
        preferredDate,preferredTime:'',language:'tr',
        items:selected.map(p=>({id:p.id,qty:quantities[p.id]}))
      })});
      const result=await readJson(response) as {number:string;total:number;whatsappMessage?:string};
      setSuccess(result);
    }catch(error){setMessage((error as Error).message||'Sipariş talebi oluşturulamadı.');}
    finally{setBusy(false);}
  }
  if(success)return <main className="min-h-screen bg-[#fff7fb] px-5 py-16 text-[#5b102d]"><section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm"><p className="text-sm font-semibold tracking-[.2em]">PINK ROSE CAFE</p><h1 className="mt-5 text-3xl font-bold">Sipariş talebin alındı.</h1><p className="mt-4">Sipariş numaran: <strong>{success.number}</strong></p><p className="mt-2 text-xl font-semibold">{money(success.total)}</p>{success.whatsappMessage&&<a className="mt-7 inline-flex rounded-full bg-[#a80000] px-7 py-3 font-semibold text-white" href={'https://wa.me/'+whatsapp+'?text='+encodeURIComponent(success.whatsappMessage)} target="_blank" rel="noreferrer">WhatsApp üzerinden devam et</a>}<p className="mt-5 text-sm">Sipariş, ödeme ve teslimat ayrıntıları Pink Rose Cafe tarafından WhatsApp üzerinden netleştirilecektir.</p></section></main>;
  return <main className="min-h-screen bg-[#fff7fb] text-[#5b102d]">
    <header className="border-b border-[#f2d5e3] bg-white/90 px-5 py-5"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/" aria-label="Pink Rose Cafe ana sayfasına dön" className="group rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a80000]"><p className="text-xl font-black tracking-tight">PINK ROSE <span className="text-[#a80000]">CAFE</span></p><p className="text-xs tracking-[.18em] text-[#9b647b]">EL YAPIMI COOKIE & KURABİYE</p></Link><div className="flex items-center gap-3"><img src="https://staticsstage.vrunibex.com/uploadedfilecontainer/Vestel%20kirmizi%20logo_2026042213245087295.svg" alt="Vestel" className="h-7 w-auto"/><span className="rounded-full bg-[#a80000] px-4 py-2 text-xs font-bold text-white">VESTEL’E ÖZEL</span></div></div></header>
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 pb-8 pt-12 text-center sm:pt-16"><p className="w-full text-center text-sm font-bold tracking-[.25em] text-[#a80000]">VESTEL ÇALIŞANLARINA ÖZEL</p><h1 className="mx-auto mt-4 w-full max-w-3xl text-center text-4xl font-black leading-tight sm:text-6xl">{campaign.title||'Pink Rose’dan size özel lezzetler'}</h1><p className="mx-auto mt-5 w-full max-w-2xl text-center text-base leading-7 text-[#80556a]">{campaign.text||'Callebaut Belçika çikolatası ve %100 yayık tereyağıyla hazırlanan kurabiyelerimizi keşfedin.'}</p></section>
    <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-8 sm:grid-cols-2 lg:grid-cols-4">{packages.map(p=><article key={p.qty} className="rounded-2xl border border-[#edc7d9] bg-white p-5 text-center shadow-sm"><p className="text-sm font-semibold text-[#9b647b]">{p.qty} ADET PAKET</p><p className="mt-2 text-3xl font-black">{money(p.price)}</p><p className="mt-1 text-xs font-medium text-[#80556a]">Toplam yaklaşık {p.qty*120}–{p.qty*150} g</p></article>)}<article className="rounded-2xl border border-[#edc7d9] bg-white p-5 text-center shadow-sm"><p className="text-sm font-semibold text-[#9b647b]">EK ÜRÜN</p><p className="mt-2 text-3xl font-black">{money(single)}</p></article></section>
    <div className="flex w-full justify-center px-5 pb-6"><p className="mx-auto w-full max-w-3xl rounded-2xl border border-[#edc7d9] bg-white px-6 py-4 text-center text-sm leading-7 text-[#80556a] shadow-sm">Etkinlik siparişlerinde, etkinlik siparişi seçeneği işaretlenerek {eventMin} adet ve üzeri alımlarda birim fiyat <strong className="text-[#a80000]">{money(config?.eventUnitPrice??12500)}</strong>’dir. Bu özel fiyat normal sipariş paketlerinden ayrı uygulanır.</p></div>
    <section className="mx-auto max-w-6xl px-5 py-8"><div className="mb-5"><h2 className="text-2xl font-bold">Kurabiyelerini seç</h2><p className="mt-1 text-sm text-[#80556a]">Adetleri artırıp azaltarak sepetini oluşturabilirsin.</p></div><div className="product-grid campaign-product-grid">{products.map((p,i)=><article className="product" key={p.id}><ProductGallery language="tr" product={p} tone={i%3} onInspect={()=>router.push(productPath(p))}/><div className="product-info"><span className="eyebrow">{p.category}</span><Link className="product-name" href={productPath(p)}><h3>{p.name}</h3></Link><ProductNutrition product={p} english={false}/><FlavourNotes product={p} language="tr"/><ProductLabels product={p} language="tr"/><p className="product-description">{(p.ingredients||p.description||"").split(/(?<=[.!?])\\s+/)[0]}</p><div className="product-bottom"><div className="price"><strong>{money(p.price)}</strong><small className="block text-xs text-[#80556a]">Normal fiyat</small></div><div className="flex items-center gap-3"><button type="button" aria-label={p.name+" azalt"} onClick={()=>change(p.id,-1)} className="h-9 w-9 rounded-full border border-[#d9a7bd] text-lg">−</button><strong className="min-w-4 text-center">{quantities[p.id]||0}</strong><button type="button" aria-label={p.name+" artır"} onClick={()=>change(p.id,1)} className="h-9 w-9 rounded-full bg-[#a80000] text-lg text-white">+</button></div></div><Link className="text-link mt-3 inline-block" href={productPath(p)}>Ürün detayları ve tüm bilgiler →</Link></div></article>)}</div></section>
    <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-bold">Sipariş bilgileri</h2><label className="mt-5 block text-sm font-semibold">Ad soyad<input required minLength={2} value={customer} onChange={e=>setCustomer(e.target.value)} className="mt-2 w-full rounded-xl border border-[#e8cbd8] px-4 py-3"/></label><label className="mt-4 block text-sm font-semibold">Cep telefonu<input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="05XX XXX XX XX" className="mt-2 w-full rounded-xl border border-[#e8cbd8] px-4 py-3"/></label><label className="mt-4 block text-sm font-semibold">Vestel sicil numarası<input required value={vestelSicilNo} onChange={e=>setVestelSicilNo(e.target.value)} placeholder="Vestel sicil numaran" maxLength={30} className="mt-2 w-full rounded-xl border border-[#e8cbd8] px-4 py-3"/></label><label className="mt-4 block text-sm font-semibold">Teslim almak istediğin tarih<input required type="date" value={preferredDate} onChange={e=>setPreferredDate(e.target.value)} className="mt-2 w-full rounded-xl border border-[#e8cbd8] px-4 py-3"/></label><label className="mt-4 block text-sm font-semibold">Sipariş notu<textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[#e8cbd8] px-4 py-3"/></label><button disabled={!quote||busy} className="mt-6 w-full rounded-full bg-[#a80000] px-6 py-4 font-bold text-white disabled:opacity-40">{busy?'Gönderiliyor…':'Sipariş talebi oluştur'}</button>{message&&<p role="alert" className="mt-3 text-sm text-red-700">{message}</p>}<p className="mt-4 text-xs leading-5 text-[#80556a]">Bu form sipariş talebi oluşturur. Kesin teslimat zamanı ve ödeme bilgileri WhatsApp üzerinden teyit edilir.</p></form>
      <aside className="h-fit rounded-3xl border border-[#edc7d9] bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Sepet özeti</h2><label className="mt-5 flex items-start gap-3 rounded-xl bg-[#fff2f7] p-4 text-sm"><input type="checkbox" checked={eventOrder} onChange={e=>setEventOrder(e.target.checked)} className="mt-1"/><span><strong>Etkinlik siparişi</strong><br/>{eventMin} adet ve üzeri siparişlerde {money(config?.eventUnitPrice??12500)} / adet. Normal paket fiyatlarından ayrı hesaplanır.</span></label><div className="mt-5 space-y-2 text-sm">{selected.map(p=><div key={p.id} className="flex justify-between gap-3"><span>{quantities[p.id]} × {p.name}</span><span>{money(p.price*quantities[p.id])}</span></div>)}</div>{quote?<><div className="mt-5 border-t border-[#f0d5e1] pt-4 text-sm"><div className="flex justify-between"><span>Normal toplam</span><span>{money(quote.normalSubtotal)}</span></div><div className="mt-2 flex justify-between text-[#a80000]"><span>Kampanya indirimi</span><span>−{money(quote.savings)}</span></div><div className="mt-3 flex justify-between text-lg font-black"><span>Ödenecek</span><span>{money(quote.campaignTotal)}</span></div><p className="mt-3 text-xs text-[#80556a]">{quote.breakdown.map(x=>x.qty+' adet · '+x.label+' · '+money(x.lineTotal)).join(' / ')}</p>{eventOrder&&quote.quantity<eventMin&&<p className="mt-2 text-xs text-red-700">Etkinlik siparişi için en az {eventMin} adet seçmelisin.</p>}</div></>:<p className="mt-5 text-sm text-[#9b647b]">{selected.length?quoteState.error:'Fiyatı görmek için ürün seç.'}</p>}</aside>
    </section>
    <footer className="border-t border-[#f2d5e3] bg-white px-5 py-7 text-center text-xs text-[#9b647b]">© Pink Rose Cafe · Manisa</footer>
  </main>;
}
