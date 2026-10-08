import styles from './portion-info.module.css';
import type {Product} from '@/lib/types';
import {boxWeight} from '@/lib/nutrition';
export function CookieSizeIntro({products,english=false}:{products:Product[];english?:boolean}){
 const range=boxWeight(products,1);
 if(!range)return null;
 return <div className={styles.intro}><strong>{english?'Big, generously filled New York cookies':'Büyük boy, bol dolgulu New York cookie'}</strong><p>{english?'A full-sized sweet break.':'Minik bir kurabiye değil, dolu dolu bir tatlı molası.'} {english?'Each cookie':'Her biri'} {range[0]===range[1]?range[0]:`${range[0]}–${range[1]}`} g.</p></div>;
}
export function BoxWeight({products,qty,english=false}:{products:Product[];qty:number;english?:boolean}){
 const range=boxWeight(products,qty);
 if(!range)return null;
 const [lo,hi]=range;
 const headline=qty===4&&lo>=450&&hi<=650?(english?'Around half a kilo of cookie joy':'Yaklaşık yarım kilo cookie keyfi'):qty===8&&lo>=900&&hi<=1300?(english?'Around a kilo of happiness':'Yaklaşık bir kilo mutluluk'):null;
 return <p className={styles.boxWeight}>{headline&&<strong>{headline}</strong>}<span>{english?'Approx. total weight':'Yaklaşık toplam gramaj'}: {lo===hi?lo:`${lo}–${hi}`} g</span></p>;
}
