'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {Menu,X,ShoppingBag} from 'lucide-react';
import type {Language} from '@/lib/i18n';

export default function ShopNavigation({language,count,onLanguage,onCart}:{language:Language;count:number;onLanguage:(l:Language)=>void;onCart:()=>void}){
 const pathname=usePathname(),en=language==='en';
 const [expanded,setExpanded]=useState(false);const toggle=useRef<HTMLButtonElement>(null);
 useEffect(()=>setExpanded(false),[pathname]);
 const links=[['/kurabiyeler',en?'Cookies':'Kurabiyeler'],['/kutunu-olustur',en?'Build a box':'Kutunu oluştur'],['/kutlama-etkinlik',en?'Celebrations':'Kutlama & Etkinlik'],['/hikayemiz',en?'Our story':'Hikâyemiz']];
 const menu=links.map(([href,label])=><Link key={href} href={href} aria-current={pathname===href||(href==='/kurabiyeler'&&pathname.startsWith(href+'/'))?'page':undefined} onClick={()=>setExpanded(false)}>{label}</Link>);
 return <header className="site-header" onKeyDown={e=>{if(e.key==='Escape'&&expanded){setExpanded(false);toggle.current?.focus();}}}>
  <Link className="wordmark" href="/" onClick={()=>setExpanded(false)}>Pink Rose<span>CAFE</span></Link>
  <nav className="desktop-navigation" aria-label={en?'Main navigation':'Ana menü'}>{menu}</nav>
  <div className="header-actions"><div className="language-switch" role="group" aria-label={en?'Choose language':'Dil seçimi'}><button type="button" lang="tr" aria-label="Türkçe" aria-pressed={!en} onClick={()=>onLanguage('tr')}>TR</button><button type="button" lang="en" aria-label="English" aria-pressed={en} onClick={()=>onLanguage('en')}>EN</button></div><button className="cart-button" aria-label={(en?'My basket, ':'Sepetim, ')+count+(en?' items':' ürün')} onClick={()=>{setExpanded(false);onCart();}}><ShoppingBag size={19}/><span>{en?'My basket':'Sepetim'}</span><b>{count}</b></button><button ref={toggle} className="mobile-menu-toggle" aria-expanded={expanded} aria-controls="mobile-shop-menu" aria-label={expanded?(en?'Close menu':'Menüyü kapat'):(en?'Open menu':'Menüyü aç')} onClick={()=>setExpanded(v=>!v)}>{expanded?<X size={21}/>:<Menu size={21}/>}</button></div>
  <nav className="mobile-navigation-panel" id="mobile-shop-menu" aria-label={en?'Mobile navigation':'Mobil menü'} hidden={!expanded}>{menu}</nav>
 </header>;
}
