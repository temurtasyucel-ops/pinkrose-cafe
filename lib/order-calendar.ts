import type {Order} from './types';
import {earliestOrderDate,leadDays,validOrderDate} from './order-date.ts';

export type CalendarConfig={dailyLimit:number;closedDates:string[]};
export type CalendarBooking={orderId:string;day:string;quantity:number;heldAt?:string};
export type CalendarState=CalendarConfig&{revision:number;bookings:Record<string,CalendarBooking>};
export type PublicCalendar=CalendarConfig&{booked:Record<string,number>;revision:number};
export const emptyCalendar:CalendarState={dailyLimit:0,closedDates:[],revision:0,bookings:{}};
export function cleanCalendarConfig(value:unknown):CalendarConfig{
 const v=value as CalendarConfig;
 if(!v||!Number.isInteger(v.dailyLimit)||v.dailyLimit<0||v.dailyLimit>100000||!Array.isArray(v.closedDates)||v.closedDates.length>366||v.closedDates.some(d=>typeof d!=='string'||!validOrderDate(d,'2000-01-01')))throw Error('Günlük kapasiteyi ve kapalı günleri kontrol edin.');
 return {dailyLimit:v.dailyLimit,closedDates:[...new Set(v.closedDates)].sort()};
}
// A move temporarily occupies both dates. Duplicate holds for the same order/day
// count once, so concurrent changes cannot free a slot before the order is saved.
export function bookedTotals(bookings:CalendarState['bookings']){
 const grouped:Record<string,number>={},totals:Record<string,number>={};
 for(const b of Object.values(bookings))grouped[b.day+'|'+b.orderId]=Math.max(grouped[b.day+'|'+b.orderId]||0,b.quantity);
 for(const [key,qty] of Object.entries(grouped)){const day=key.split('|')[0];totals[day]=(totals[day]||0)+qty;}
 return totals;
}
export function publicCalendar(s:CalendarState):PublicCalendar{return {dailyLimit:s.dailyLimit,closedDates:s.closedDates,booked:bookedTotals(s.bookings),revision:s.revision};}
export function orderBooking(o:Order):CalendarBooking|null{
 if(o.demo||o.status==='İptal')return null;
 const day=o.confirmedAt?new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(o.confirmedAt)):o.preferredDate;
 const quantity=o.capacityQty??o.items.reduce((n,i)=>n+i.qty,0);
 return day&&validOrderDate(day,'2000-01-01')&&quantity>0?{orderId:o.id,day,quantity}:null;
}
export function holdBooking(s:CalendarState,key:string,b:CalendarBooking){
 if(s.closedDates.includes(b.day))throw Error('Bu gün siparişe kapalı. Lütfen başka bir gün seçin.');
 if(s.bookings[key]&&(s.bookings[key].orderId!==b.orderId||s.bookings[key].day!==b.day||s.bookings[key].quantity!==b.quantity))throw Error('Sipariş işlemi sürüyor. Lütfen aynı seçimle tekrar deneyin.');
 const bookings={...s.bookings,[key]:b};
 if(s.dailyLimit>0&&(bookedTotals(bookings)[b.day]||0)>s.dailyLimit)throw Error('Seçtiğiniz gün için yeterli kapasite kalmadı. Lütfen başka bir gün veya daha az adet seçin.');
 return {...s,bookings};
}
export function dateAvailable(c:PublicCalendar|undefined,day:string,quantity=1){return !c||(!c.closedDates.includes(day)&&(!c.dailyLimit||(c.booked[day]||0)+quantity<=c.dailyLimit));}
export function availableDates(settings:{leadDays?:number},calendar:PublicCalendar|undefined,quantity=1,now=new Date()){
 const min=earliestOrderDate(leadDays(settings),now),end=earliestOrderDate(365,now),days:string[]=[];
 for(let day=min;day<=end;){if(dateAvailable(calendar,day,quantity))days.push(day);const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);day=d.toISOString().slice(0,10);}
 return days;
}
export function assertPreferredDate(day:unknown,settings:{leadDays?:number},calendar:PublicCalendar|undefined,quantity:number,now=new Date()){
 if(typeof day!=='string'||!validOrderDate(day,earliestOrderDate(leadDays(settings),now))||day>earliestOrderDate(365,now))throw Error('Hazırlık süresine uygun bir teslim günü seçin.');
 if(!dateAvailable(calendar,day,quantity))throw Error('Seçtiğiniz gün kapalı veya kapasitesi dolu. Lütfen başka bir gün seçin.');
 return day;
}
