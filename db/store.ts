import {service} from '@/lib/supabase/service';
import {orderStatus,deliveryQuote} from '@/lib/types';
import {seed} from '@/lib/seed';
import type {Catalog,Order,Product,Campaign} from '@/lib/types';

function check(error:{message:string}|null){if(error){console.error('Database:',error.message);throw Error('Veri işlemi tamamlanamadı. Lütfen tekrar deneyin.');}}
export async function initialize(){
  const rows=[
    {id:'settings',kind:'settings',data:seed.settings},
    {id:'categories',kind:'categories',data:seed.categories},
    {id:'packages',kind:'packages',data:{packages:seed.packages}},
    ...seed.products.map(p=>({id:p.id,kind:'product',data:p}))
  ];
  const {error}=await service().from('records').upsert(rows,{onConflict:'id',ignoreDuplicates:true});check(error);
}
export async function catalog(all=false):Promise<Catalog>{
  await initialize();
  const {data,error}=await service().from('records').select('id,kind,data');check(error);
  const rows=data || [];
  const record=(id:string)=>rows.find(r=>r.id===id)?.data;
  const products=rows.filter(r=>r.kind==='product').map(r=>r.data as Product).filter(p=>all || p.active).sort((a,b)=>a.sort-b.sort);
  const packageRecord=record('packages');
  const packageData={packages:packageRecord.packages};
  if(Object.keys(packageRecord).some(key=>key!=='packages')){
    const {error:cleanupError}=await service().from('records').update({data:packageData}).eq('id','packages').eq('data',JSON.stringify(packageRecord));
    check(cleanupError);
  }
  return {...packageData,products,categories:record('categories'),settings:{...seed.settings,...record('settings')},campaigns:rows.filter(r=>r.kind==='campaign').map(r=>r.data as Campaign)};
}
export async function put(id:string,kind:string,data:unknown){
  const {error}=await service().from('records').upsert({id,kind,data},{onConflict:'id'});check(error);
}
export async function getOrders():Promise<Order[]>{
  const {data,error}=await service().from('orders').select('data').order('created',{ascending:false}).limit(500);check(error);
  return (data || []).map(r=>({...r.data,status:orderStatus(r.data.status)}) as Order);
}
export async function orderByKey(key:string):Promise<Order|null>{
  const {data,error}=await service().from('orders').select('data').eq('request_key',key).maybeSingle();check(error);
  return data?.data || null;
}
export async function saveOrder(key:string,order:Order):Promise<Order>{
  const {error}=await service().from('orders').upsert({id:order.id,request_key:key,data:order,created:order.created},{onConflict:'request_key',ignoreDuplicates:true});check(error);
  const saved=await orderByKey(key);if(!saved)throw Error('Sipariş kaydedilemedi.');return saved;
}
async function changeOrder(id:string,change:(order:Order)=>Order){
 const client=service();
 const {data,error}=await client.from('orders').select('data').eq('id',id).maybeSingle();check(error);
 if(!data)throw Error('Sipariş bulunamadı.');
 const {data:updated,error:updateError}=await client.from('orders').update({data:change(data.data as Order)}).eq('id',id).eq('data',JSON.stringify(data.data)).select('id').maybeSingle();check(updateError);
 if(!updated)throw Error('Sipariş başka bir işlemle güncellendi. Yenileyip tekrar deneyin.');
}
export async function updateStatus(id:string,status:string){await changeOrder(id,o=>({...o,status}));}
export async function updateDelivery(id:string,fee:number){await changeOrder(id,o=>deliveryQuote(o,fee));}
