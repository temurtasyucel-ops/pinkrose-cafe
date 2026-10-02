import assert from 'node:assert/strict';
import {cleanCart,submissionKey} from '../lib/cart.ts';
import {priceBasket,tastingSelection} from '../lib/pricing.ts';
import {deliveryQuote,filterOrders,customerWhatsApp,orderSummary,customerOrderMessage} from '../lib/types.ts';
import {readJson} from '../lib/http.ts';
assert.deepEqual(cleanCart({'cookie-1':100,'cookie-2':-1,'cookie-3':1.2,'invalid':2}),{'cookie-1':50});
assert.deepEqual(cleanCart(null),{});
const first=submissionKey(null,'basket1',()=> 'key1');
assert.equal(submissionKey(first,'basket1',()=> 'key2').key,'key1');
assert.equal(submissionKey(first,'basket2',()=> 'key2').key,'key2');
const catalog={products:Array.from({length:7},(_,i)=>({id:'cookie-'+(i+1),active:true,stock:true})),packages:[{qty:2,price:30000},{qty:4,price:60000},{qty:6,price:90000},{qty:8,price:110000}],tastingPrice:100000};
assert.equal(priceBasket(catalog,[{id:'cookie-1',qty:2,price:16000},{id:'cookie-2',qty:1,price:10000}]).packageDiscount,2000);
assert.equal(priceBasket(catalog,Array.from({length:7},(_,i)=>({id:'cookie-'+(i+1),qty:1,price:16000}))).packageDiscount,12000);
// Independent exhaustive allocation checks each possible box subset, not the pricing DP.
function exhaustive(prices,boxes){
 const cache=new Map();
 function solve(mask){if(!mask)return 0;if(cache.has(mask))return cache.get(mask);
  const first=prices.findIndex((_,i)=>mask&(1<<i));let best=prices[first]+solve(mask^(1<<first));
  for(let subset=mask;subset;subset=(subset-1)&mask){if(!(subset&(1<<first)))continue;const size=subset.toString(2).replaceAll('0','').length;for(const box of boxes)if(box.qty===size)best=Math.min(best,box.price+solve(mask^subset));}
  cache.set(mask,best);return best;
 }return solve((1<<prices.length)-1);
}
for(let k=0;k<20;k++){
 const prices=Array.from({length:6},(_,i)=>10000+((k*7+i*3)%10)*1000);
 const basket=prices.map((price,i)=>({id:'cookie-'+(i+1),qty:1,price}));
 const result=priceBasket(catalog,basket);
 assert.equal(result.subtotal-result.packageDiscount,exhaustive(prices,catalog.packages));
}
const o={number:'PR-TEST',customer:'İPEK ŞEN',phone:'05060584705',type:'Teslimat',subtotal:32000,discount:2000,total:30000,status:'Yeni',deliveryFee:0,deliveryFeePending:true,demo:false};
const quoted=deliveryQuote(o,7500);assert.equal(quoted.total,37500);assert.equal(deliveryQuote(quoted,5000).total,35000);
assert.equal(deliveryQuote(quoted,0).total,30000);assert.equal(quoted.deliveryFeePending,false);
for(const fee of [-1,NaN,1.1,10000001])assert.throws(()=>deliveryQuote(o,fee));
assert.throws(()=>deliveryQuote({...o,type:'Gel-al'},1));
assert.equal(filterOrders([o],'ipek','Onay bekliyor','Canlı').length,1);
assert.equal(filterOrders([o],'0506 058 47 05','Tümü','Canlı').length,1);
assert.equal(filterOrders([o],'','Tümü','Deneme').length,0);
for(const phone of ['0506 058 47 05','5060584705','+90 506 058 47 05'])assert.equal(new URL(customerWhatsApp({...o,phone})).pathname,'/905060584705');
await assert.rejects(readJson(new Response('<html>',{status:500})),/İşlem tamamlanamadı/);
await assert.rejects(readJson(Response.json({error:'Yetki yok'},{status:403})),/Yetki yok/);
console.log('PASS: cart, retry keys, mixed-price boxes (20 exhaustive cases), quotes, filters, WhatsApp and HTTP errors.');

const pumpkin='11111111-1111-4111-8111-111111111111',ninth='22222222-2222-4222-8222-222222222222';
const expanded={...catalog,products:[...catalog.products,{id:pumpkin,boxEligible:true,active:true,stock:true},{id:ninth,boxEligible:true,active:true,stock:true}]};
for(const [qty,total] of [[8,110000],[9,126000],[10,140000]]){
 const priced=priceBasket(expanded,[{id:pumpkin,qty,price:16000}]);assert.equal(priced.subtotal-priced.packageDiscount,total);
}
const nine=expanded.products.map(p=>({id:p.id,qty:1,price:16000}));
assert.equal(priceBasket(expanded,nine).subtotal-priceBasket(expanded,nine).packageDiscount,126000); // 8-box + single beats tasting 7 + remaining 2
assert.equal(priceBasket({...expanded,products:expanded.products.map(p=>({...p,boxEligible:false}))},nine).packageDiscount,0);
const seasonal={...expanded,tastingIds:['cookie-1','cookie-2',pumpkin,'cookie-4','cookie-5','cookie-6','cookie-7'],products:expanded.products.map(p=>p.id==='cookie-3'?{...p,active:false}:p)};
const seasonalBasket=seasonal.tastingIds.map(id=>({id,price:16000,qty:1}));
assert.equal(tastingSelection(seasonal).available,true);
assert.equal(priceBasket(seasonal,seasonalBasket).packageDiscount,12000);
assert.equal(tastingSelection({...seasonal,products:seasonal.products.map(p=>p.id===pumpkin?{...p,stock:false}:p)}).available,false);
assert.equal(tastingSelection({...seasonal,tastingIds:Array(7).fill(pumpkin)}).available,false);
assert.equal(priceBasket({...seasonal,tastingIds:Array(7).fill(pumpkin)},seasonalBasket).packageDiscount,6000);
assert.equal(priceBasket({...expanded,products:expanded.products.map(p=>p.id===pumpkin?{...p,boxEligible:false}:p)},[{id:pumpkin,qty:8,price:16000}]).packageDiscount,0);
console.log('PASS: 8/9/10 items, new varieties, seasonal replacement, invalid/unavailable tasting and excluded products.');

const summary=orderSummary({...o,items:[{id:'cookie-1',name:'Gülpembe',price:16000,qty:2}],address:'Test adresi',date:'Cumartesi',note:'Hediye'});
assert.ok(summary.includes('Teslimat hariç ürün toplamı:'));
assert.ok(summary.includes('Ücret henüz belirlenmedi'));
assert.ok(summary.includes('2 × Gülpembe'));
assert.ok(!orderSummary({...o,type:'Gel-al',deliveryFeePending:false,items:[],address:'Eski adres'}).includes('Eski adres'));
const {productCare,defaultPreparation,defaultStorage,defaultHeating}=await import('../lib/care.ts');
assert.ok(defaultPreparation.includes('2–3 gün'));
assert.deepEqual(productCare({category:'Kurabiyeler'},{}),{storage:defaultStorage,heating:defaultHeating});
assert.deepEqual(productCare({category:'Kurabiyeler',storageInfo:'Soğuk tutun',heatingInfo:'Isıtmayın'},{}),{storage:'Soğuk tutun',heating:'Isıtmayın'});
assert.deepEqual(productCare({category:'Sandviç'},{}),{storage:'',heating:''});
console.log('PASS: pending delivery summary, pickup privacy, care defaults and product overrides.');

const message=customerOrderMessage({...o,number:'PR-MESSAGE',items:[{id:'cookie-1',name:'Gülpembe',price:16000,qty:2}],date:'Pazar 15.00',address:'Test sokak 5',note:'Hediye kutusu'});
for(const detail of ['PR-MESSAGE','2 × Gülpembe','Pazar 15.00','Test sokak 5','Hediye kutusu','Telefon:','Ara toplam:','İndirim:','Teslimat hariç ürün toplamı:'])assert.ok(message.includes(detail),detail);
assert.ok(!customerOrderMessage({...o,demo:true,items:[]}).includes('IBAN'));
console.log('PASS: complete customer WhatsApp message and demo distinction.');
