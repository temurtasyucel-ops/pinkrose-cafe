import type {Order} from './types';
import {deliveryBuckets,missingConfirmedOrders} from './order-planning.ts';
export function dailyWork(orders:Order[],now=new Date()){
 const live=orders.filter(o=>!o.demo),buckets=deliveryBuckets(live,now);
 const oldest=(a:Order,b:Order)=>a.created.localeCompare(b.created);
 return {approval:live.filter(o=>['Yeni','Onay bekliyor'].includes(o.status)).sort(oldest),payment:live.filter(o=>o.status==='Ödeme bekleniyor').sort(oldest),today:buckets.today,tomorrow:buckets.tomorrow,overdue:buckets.overdue,undated:missingConfirmedOrders(live)};
}
