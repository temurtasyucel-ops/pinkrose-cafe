import 'server-only';
import {ServiceFailure} from '@/lib/diagnostics';
import {service} from '@/lib/supabase/service';
import {emptyCalendar,cleanCalendarConfig,holdBooking,orderBooking,type CalendarState,type CalendarBooking} from '@/lib/order-calendar';
import type {Order} from '@/lib/types';

const recordId='order-calendar';
function check(error:{message:string;code?:string}|null){if(error)throw new ServiceFailure('Sipariş takvimi yüklenemedi. Lütfen tekrar deneyin.',error.code);}
async function allOrders(){
 const orders:Order[]=[];
 for(let from=0;;from+=1000){const {data,error}=await service().from('orders').select('data').order('id').range(from,from+999);check(error);orders.push(...(data||[]).map(r=>r.data as Order));if((data||[]).length<1000)return orders;}
}
export async function calendarState():Promise<CalendarState>{
 const {data,error}=await service().from('records').select('data').eq('id',recordId).maybeSingle();check(error);
 if(data)return data.data as CalendarState;
 const bookings:CalendarState['bookings']={};
 for(const o of await allOrders()){const b=orderBooking(o);if(b)bookings[o.id]=b;}
 const initial={...emptyCalendar,bookings};
 const {error:insertError}=await service().from('records').insert({id:recordId,kind:'order-calendar',data:initial});
 if(insertError?.code==='23505')return calendarState();check(insertError);return initial;
}
async function changeCalendar(change:(state:CalendarState)=>CalendarState|Promise<CalendarState>){
 for(let attempt=0;attempt<12;attempt++){
  const current=await calendarState(),next={...await change(current),revision:current.revision+1};
  const {data,error}=await service().from('records').update({data:next}).eq('id',recordId).eq('data',JSON.stringify(current)).select('id').maybeSingle();check(error);
  if(data)return next;
 }
 throw Error('Takvim aynı anda güncellendi. Lütfen tekrar deneyin.');
}
export async function configureCalendar(value:unknown,expected:number){
 const config=cleanCalendarConfig(value);
 return changeCalendar(s=>{if(s.revision!==expected)throw Error('Takvim değişti. Yenileyip tekrar kaydedin.');return {...s,...config};});
}
export async function reserveCalendar(key:string,booking:CalendarBooking){return changeCalendar(s=>holdBooking(s,key,{...booking,heldAt:s.bookings[key]?.heldAt||new Date().toISOString()}));}
// Read order AFTER the calendar version, then compare-and-swap. A concurrent
// finalizer invalidates the version; an unfinished mutation retains its hold.
export async function settleCalendar(hold:string,orderId:string){
 return changeCalendar(async s=>{
  const {data,error}=await service().from('orders').select('data').eq('id',orderId).maybeSingle();check(error);
  const bookings={...s.bookings};delete bookings[hold];delete bookings[orderId];
  if(data){const b=orderBooking(data.data as Order);if(b)bookings[orderId]=b;}
  return {...s,bookings};
 });
}
export async function repairCalendar(){
 return changeCalendar(async s=>{
  const bookings:CalendarState['bookings']={};
  for(const o of await allOrders()){const b=orderBooking(o);if(b)bookings[o.id]=b;}
  // API requests have a 60s maximum runtime. Keep holds for 15 minutes so
  // an in-flight request cannot lose its capacity during reconciliation.
  for(const [key,b] of Object.entries(s.bookings))if(key.startsWith('hold:')&&(!b.heldAt||Date.parse(b.heldAt)>Date.now()-15*60000))bookings[key]=b;
  return {...s,bookings};
 });
}
