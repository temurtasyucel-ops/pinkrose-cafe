import type {Order} from './types';
const zone='Europe/Istanbul';
export function localSchedule(value?:string){
 if(!value||!Number.isFinite(Date.parse(value)))return '';
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));
 const p=(key:string)=>parts.find(v=>v.type===key)!.value;
 return `${p('year')}-${p('month')}-${p('day')}T${p('hour')}:${p('minute')}`;
}
export function dayInIstanbul(now=new Date()){return localSchedule(now.toISOString()).slice(0,10);}
export function shiftDay(day:string,amount:number){const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
export function parseSchedule(value:unknown){
 if(value==='')return '';
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value))throw Error('Geçerli kesin teslim tarihi ve saati girin.');
 const date=new Date(value+':00+03:00');
 if(!Number.isFinite(date.getTime())||localSchedule(date.toISOString())!==value)throw Error('Geçerli kesin teslim tarihi ve saati girin.');
 return date.toISOString();
}
export function scheduleLabel(value?:string,language:'tr'|'en'='tr'){
 return localSchedule(value)?new Intl.DateTimeFormat(language==='en'?'en-GB':'tr-TR',{timeZone:zone,dateStyle:'medium',timeStyle:'short'}).format(new Date(value!)):'';
}
export function setConfirmedSchedule(order:Order,value:unknown,expected:string):Order{
 if((order.confirmedAt||'')!==expected)throw Error('Teslim zamanı başka bir işlemle değişti. Listeyi yenileyip tekrar deneyin.');
 return {...order,confirmedAt:parseSchedule(value)};
}
export function openLiveOrders(orders:Order[]){return orders.filter(o=>!o.demo&&!['İptal','Teslim edildi'].includes(o.status));}
export function deliveryBuckets(orders:Order[],now=new Date()){
 const today=dayInIstanbul(now),tomorrow=shiftDay(today,1);
 const result:{overdue:Order[];today:Order[];tomorrow:Order[];later:Order[];undated:Order[]}={overdue:[],today:[],tomorrow:[],later:[],undated:[]};
 for(const order of openLiveOrders(orders)){
  const day=localSchedule(order.confirmedAt).slice(0,10);
  if(!day)result.undated.push(order);
  else if(day<today)result.overdue.push(order);
  else if(day===today)result.today.push(order);
  else if(day===tomorrow)result.tomorrow.push(order);
  else result.later.push(order);
 }
 for(const list of Object.values(result))list.sort((a,b)=>(a.confirmedAt||a.created).localeCompare(b.confirmedAt||b.created));
 return result;
}
export function productionPlan(orders:Order[],day:string){
 const open=openLiveOrders(orders),scheduled=open.filter(o=>localSchedule(o.confirmedAt).slice(0,10)===day);
 const paid=(o:Order)=>['Ödeme alındı','Hazırlanıyor'].includes(o.status);
 const confirmed=scheduled.filter(paid),products=new Map<string,{id:string;name:string;qty:number}>();
 for(const order of confirmed)for(const item of order.items){const current=products.get(item.id);if(current)current.qty+=item.qty;else products.set(item.id,{id:item.id,name:item.name,qty:item.qty});}
 const items=[...products.values()].sort((a,b)=>a.name.localeCompare(b.name,'tr'));
 return {orders:confirmed,items,total:items.reduce((n,p)=>n+p.qty,0),unpaid:scheduled.filter(o=>!paid(o)).length,undatedPaid:open.filter(o=>paid(o)&&!localSchedule(o.confirmedAt)).length};
}
export function productionText(orders:Order[],day:string){const plan=productionPlan(orders,day);return ['Pink Rose · Günlük üretim',day,...plan.items.map(p=>`${p.qty} × ${p.name}`),`Toplam: ${plan.total} adet · ${plan.orders.length} sipariş`,'Yalnızca ödeme kontrolü tamamlanmış, kesin teslim günü atanmış açık canlı siparişler.'].join('\n');}

export function missingConfirmedOrders(orders:Order[]){return openLiveOrders(orders).filter(o=>['Ödeme alındı','Hazırlanıyor'].includes(o.status)&&!localSchedule(o.confirmedAt));}
export function recordStatusChange(order:Order,status:string,expected:string,now=new Date()):Order{
 const current=order.status==='Yeni'?'Onay bekliyor':order.status;
 if(current!==expected)throw Error('Sipariş durumu başka bir işlemle değişti. Yenileyip tekrar deneyin.');
 if(current===status)return order;
 return {...order,status,statusHistory:[...(order.statusHistory||[]),{from:current,to:status,at:now.toISOString()}]};
}
