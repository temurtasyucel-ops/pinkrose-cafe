'use client';
import {useState} from 'react';
import type {Product,Settings} from '@/lib/types';
import {heroSelection} from '@/lib/hero';
import styles from './hero-visual.module.css';
export default function HeroVisual({settings,products,english=false}:{settings:Settings;products:Product[];english?:boolean}){
 const visual=heroSelection(settings,products);
 const [failed,setFailed]=useState('');
 const selection=visual.image&&failed===visual.image?heroSelection({...settings,heroMode:'collection'},products):visual;
 return <div className={'hero-photo '+styles.frame}>
  {selection.mode==='collection'?<div className={styles.collection} aria-label={english?'The Pink Rose selection':'Pink Rose seçkisi'}><span className={styles.eyebrow}>{english?'YOUR SWEET LITTLE BREAK':'PINK ROSE SEÇKİSİ'}</span><div className={styles.photos}>{selection.products.map(p=><figure key={p.id}><img src={p.image} alt={'Pink Rose · '+p.name} fetchPriority="high"/><figcaption>{english?(p.english?.name||p.name):p.name}</figcaption></figure>)}</div><span className={styles.foot}>{english?'Pick your favourite. Mix your flavours.':'Sevdiğin tadı seç. Çeşitleri karıştır.'}</span></div>:<img className={styles.single} src={selection.image} alt={selection.alt} fetchPriority="high" onError={()=>setFailed(selection.image)}/>}
 </div>;
}
