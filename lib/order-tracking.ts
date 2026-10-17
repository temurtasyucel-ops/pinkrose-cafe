import type {Order} from './types';
export function trackingPath(token:string){return /^[a-f0-9]{64}$/.test(token)?'/siparis/'+token:'';}
export function trackingUrl(o:Pick<Order,'trackingToken'>){const path=trackingPath(o.trackingToken||'');return path?'https://www.pinkrosecafe.com.tr'+path:'';}
// Explicit allowlist: never return names, phones, addresses, private notes,
// gift details, status history, request keys or the stored tracking credential.
export function publicOrderStatus(o:Order){return {number:o.number,status:o.status==='Yeni'?'Onay bekliyor':o.status,confirmedAt:o.confirmedAt||'',preferredDate:o.preferredDate||'',preferredTimeLabel:o.preferredDate?o.date||'':'',type:o.type,city:o.city||'',items:o.items.map(i=>({name:i.name,qty:i.qty})),total:o.total,deliveryFeePending:!!o.deliveryFeePending,demo:o.demo,language:o.language||'tr'};}
export type OrderTracking=ReturnType<typeof publicOrderStatus>;
