import {setConfirmedSchedule,recordStatusChange} from '@/lib/order-planning';
import {sortedProducts,validateProductOrder} from '@/lib/product-order';
import {service} from '@/lib/supabase/service';
import {orderStatus,deliveryQuote} from '@/lib/types';
import {defaultBulkPricing,validBulkPricing} from '@/lib/pricing';
import {seed} from '@/lib/seed';
import type {Catalog,Order,Product,Campaign} from '@/lib/types';

function check(error:{message:string}|null){if(error){console.error('Database:',error.message);throw Error('Veri işlemi tamamlanamadı. Lütfen tekrar deneyin.');}}
export async function initialize(){
  const rows=[
    {id:'settings',kind:'settings',data:seed.settings},
    {id:'categories',kind:'categories',data:seed.categories},
    {id:'packages',kind:'packages',data:{packages:seed.packages,bulkPricing:seed.bulkPricing}},
    ...seed.products.map(p=>({id:p.id,kind:'product',data:p}))
  ];
  const {error}=await service().from('records').upsert(rows,{onConflict:'id',ignoreDuplicates:true});check(error);
}
export async function catalog(all=false):Promise<Catalog>{
  await initialize();
  const {data,error}=await service().from('records').select('id,kind,data');check(error);
  const rows=data || [];
  const record=(id:string)=>rows.find(r=>r.id===id)?.data;
  const products=rows.filter(r=>r.kind==='product').map(r=>r.data as Product);
  const orderedProducts=sortedProducts(products,record('product-order')).filter(p=>all || p.active);
  const packageRecord=record('packages');
  const bulkPricing=validBulkPricing(packageRecord.bulkPricing)?packageRecord.bulkPricing:defaultBulkPricing;
  const packageData={packages:packageRecord.packages.map((p:Catalog['packages'][number])=>({...p,price:p.qty*bulkPricing.unitPrice})),bulkPricing};
  if(!validBulkPricing(packageRecord.bulkPricing)||Object.keys(packageRecord).some(key=>!['packages','bulkPricing'].includes(key))||packageRecord.packages.some((p:Catalog['packages'][number])=>p.price!==p.qty*bulkPricing.unitPrice)){
    const {error:cleanupError}=await service().from('records').update({data:packageData}).eq('id','packages').eq('data',JSON.stringify(packageRecord));
    check(cleanupError);
  }
  return {...packageData,products:orderedProducts,categories:record('categories'),settings:{...seed.settings,...record('settings')},campaigns:rows.filter(r=>r.kind==='campaign').map(r=>r.data as Campaign)};
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
export async function updateStatus(id:string,status:string,expected:string){await changeOrder(id,o=>recordStatusChange(o,status,expected));}
export async function updateDelivery(id:string,fee:number){await changeOrder(id,o=>deliveryQuote(o,fee));}

export async function updateSchedule(id:string,value:unknown,expected:string){await changeOrder(id,o=>setConfirmedSchedule(o,value,expected));}
export async function reorderProducts(ids:unknown,expected:unknown){
 const client=service();
 const {data:record,error}=await client.from('records').select('data').eq('id','product-order').maybeSingle();check(error);
 const current=await catalog(true);
 const order=validateProductOrder(current.products,ids,expected);
 if(record){
  const {data:updated,error:updateError}=await client.from('records').update({data:order}).eq('id','product-order').eq('data',JSON.stringify(record.data)).select('id').maybeSingle();check(updateError);
  if(!updated)throw Error('Ürün sıralaması başka bir işlemle değişti. Yenileyip tekrar deneyin.');
 }else{
  const {error:insertError}=await client.from('records').insert({id:'product-order',kind:'product-order',data:order});
  if(insertError?.code==='23505')throw Error('Ürün sıralaması başka bir işlemle değişti. Yenileyip tekrar deneyin.');check(insertError);
 }
}
