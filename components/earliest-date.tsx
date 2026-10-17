'use client';
import {useEffect,useState} from 'react';
import type {Catalog} from '@/lib/types';
import type {Language} from '@/lib/i18n';
import {availableDates} from '@/lib/order-calendar';
export default function EarliestDate({catalog,language,quantity=1}:{catalog:Catalog;language:Language;quantity?:number}){
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const t=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(t);},[]);
 const en=language==='en',day=availableDates(catalog.settings,catalog.calendar,quantity,now)[0];
 if(catalog.settings.ordersPaused)return null;
 return <p className="earliest-date">{day?<><b>{en?'Earliest date preference: ':'En erken teslim günü tercihi: '}</b>{new Intl.DateTimeFormat(en?'en-GB':'tr-TR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'))}<small>{en?'Date and time are confirmed together on WhatsApp.':'Kesin gün ve saati WhatsApp’ta birlikte netleştiriyoruz.'}</small></>:en?'No available dates at the moment. Please contact us.':'Şu an uygun gün bulunmuyor. Bizimle iletişime geçebilirsin.'}</p>;
}
