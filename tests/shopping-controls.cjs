const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'..'),cache=new Map();
function load(file){
 file=path.resolve(root,file);if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const localRequire=name=>{
  if(!name.startsWith('.')&&!name.startsWith('@/'))return require(name);
  const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
  const resolved=[base,base+'.ts',base+'.tsx'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  return load(resolved);
 };
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,module,module.exports);return module.exports;
}
const Quantity=load('components/product-quantity.tsx').default,Steps=load('components/order-next-steps.tsx').default,Weight=load('components/cart-weight.tsx').default;
const render=(Component,props)=>renderToStaticMarkup(React.createElement(Component,props));
let adds=0,removes=0;
const base={name:'Şirine',quantity:1,language:'tr',onAdd:()=>adds++,onRemove:()=>removes++};
const first=render(Quantity,{...base,quantity:0});assert.ok(first.includes('Sepete ekle'));assert.ok(!first.includes('<output'));
const counter=Quantity(base);counter.props.children[0].props.onClick();counter.props.children[2].props.onClick();assert.equal(adds,1);assert.equal(removes,1);
assert.equal(Quantity({...base,quantity:50}).props.children[2].props.disabled,true);
assert.equal(Quantity({...base,available:false}).props.children[2].props.disabled,true);
assert.equal(Quantity({...base,available:false}).props.children[0].props.disabled,false);
assert.equal(Quantity({...base,disabled:true}).props.children[0].props.disabled,true);
assert.ok(render(Quantity,{...base,language:'en'}).includes('Remove one from basket'));
const live=render(Steps,{language:'tr',demo:false,trackingAvailable:true});assert.equal((live.match(/<li>/g)||[]).length,3);assert.ok(live.includes('IBAN')&&live.includes('ödeme alınmaz'));
const demo=render(Steps,{language:'tr',demo:true,trackingAvailable:false});assert.ok(!demo.includes('IBAN')&&!demo.includes('<ol>'));
assert.ok(!render(Steps,{language:'en',demo:false,trackingAvailable:false}).includes('order status link'));
const products=[{id:'cookie-1',boxEligible:true,weight:'120–150 g'}];
assert.ok(render(Weight,{products,cart:{'cookie-1':4}}).includes('480–600'));
assert.equal(render(Weight,{products,cart:{}}),'');
console.log('PASS: inline quantity callbacks, ceiling, availability/removal, busy controls, English labels, live/demo next steps and selected basket weight.');

const BasketItems=load('components/basket-items.tsx').default,Review=load('components/basket-review.tsx').default;
const catalog={products:[{id:'cookie-1',name:'Gülpembe',active:true,stock:true,price:17000,boxEligible:true}],bulkPricing:{minQty:2,unitPrice:15000},settings:{}};
const itemProps={catalog,cart:{'cookie-1':2},language:'tr',money:n=>String(n/100),busy:false,ready:true,onIncrease:()=>{},onDecrease:()=>{}};
const basketHtml=render(BasketItems,itemProps);assert.ok(basketHtml.includes('<del>170</del>')&&basketHtml.includes('150')&&basketHtml.includes('300'));
const pausedItems=BasketItems({...itemProps,catalog:{...catalog,settings:{ordersPaused:true}}});
const pausedRow=pausedItems.props.children[0],buttons=pausedRow.props.children[1].props.children;
assert.equal(buttons[0].props.disabled,false);assert.equal(buttons[2].props.disabled,true);
const review={compact:true,count:2,total:'Ürün toplamı: 300',deliveryNote:'Teslimat ücreti ayrıca netleşir',language:'tr',children:React.createElement('p',null,'Basket contents')};
const summaryHtml=render(Review,review);assert.ok(summaryHtml.includes('<details')&&!summaryHtml.includes(' open=""'));assert.ok(summaryHtml.includes('300')&&summaryHtml.includes('Basket contents'));
assert.ok(!render(Review,{...review,compact:false}).includes('<details'));
console.log('PASS: discounted basket units and line totals, paused additions, available removal and closed checkout summary.');

const {cartSnapshot,cleanCartSnapshot,reconcileCart,mergeCartChanges,cartQuote,cleanCartChanges}=load('lib/cart-review.ts');
const reviewCatalog={...catalog,campaigns:[],settings:{demo:false,deliveryFee:5000,deliveryQuoted:true},products:[...catalog.products,{...catalog.products[0],id:'cookie-2',name:'Aşk Dediğin'}]};
const selection={'cookie-1':2,'cookie-2':1},snapshot=cartSnapshot(reviewCatalog,selection),now=new Date('2026-10-19T06:00:00Z');
assert.equal(cleanCartSnapshot(null),null);
assert.ok(!JSON.stringify(cleanCartSnapshot({...snapshot,customer:'PRIVATE'})).includes('PRIVATE'));
const changed={...reviewCatalog,products:[{...reviewCatalog.products[0],price:18000},{...reviewCatalog.products[1],stock:false}]};
const reconciled=reconcileCart(changed,selection,snapshot,now);
assert.deepEqual(reconciled.cart,{'cookie-1':2});assert.deepEqual(reconciled.changes.map(v=>v.kind),['price','removed']);
assert.equal(reconciled.changes[0].before,17000);assert.equal(reconciled.changes[0].after,18000);
assert.equal(reconcileCart({...reviewCatalog,products:reviewCatalog.products.map(p=>({...p,lastOrderDate:'2026-10-18'}))},selection,snapshot,now).changes.length,2);
assert.equal(reconcileCart({...reviewCatalog,products:[]},selection,snapshot,now).cart['cookie-1'],undefined);
for(const patch of [{bulkPricing:{minQty:3,unitPrice:14000}},{settings:{...reviewCatalog.settings,demo:true}},{settings:{...reviewCatalog.settings,deliveryFee:7000}},{campaigns:[{active:true,start:'',end:'',discount:5}]}])assert.ok(reconcileCart({...reviewCatalog,...patch},selection,snapshot,now).changes.some(v=>v.kind==='terms'));
const merged=mergeCartChanges([reconciled.changes[0]],[{...reconciled.changes[0],before:18000,after:19000}]);assert.equal(merged.length,1);assert.equal(merged[0].before,17000);assert.equal(merged[0].after,19000);
assert.equal(cartQuote(reviewCatalog,selection,'Gel-al'),cartQuote(reviewCatalog,{'cookie-2':1,'cookie-1':2},'Gel-al'));
assert.notEqual(cartQuote(reviewCatalog,selection,'Gel-al'),cartQuote(changed,selection,'Gel-al'));
assert.notEqual(cartQuote(reviewCatalog,selection,'Gel-al'),cartQuote(reviewCatalog,selection,'Teslimat'));
assert.equal(cleanCartChanges([{kind:'price',id:'cookie-1',name:'Name',englishName:'Name',before:'wrong',after:2}]).length,0);
const Changes=load('components/cart-changes.tsx').default;
const notice=render(Changes,{changes:reconciled.changes,language:'tr',money:n=>String(n/100),onAccept:()=>{}});assert.ok(notice.includes('170')&&notice.includes('180')&&notice.includes('çıkarıldı'));
console.log('PASS: persisted public pricing snapshots, changed prices/rules, expired/missing products, merged notices, stable quotes and actionable basket review.');

const {dailyWork}=load('lib/daily-work.ts');
const baseOrder={id:'one',number:'PR-ONE',customer:'Test',demo:false,created:'2026-10-18T10:00:00Z',status:'Onay bekliyor',items:[],type:'Gel-al'};
const work=dailyWork([baseOrder,{...baseOrder,id:'legacy',status:'Yeni'},{...baseOrder,id:'payment',status:'Ödeme bekleniyor'},{...baseOrder,id:'today',status:'Ödeme alındı',confirmedAt:'2026-10-18T22:00:00Z'},{...baseOrder,id:'tomorrow',status:'Hazırlanıyor',confirmedAt:'2026-10-19T22:00:00Z'},{...baseOrder,id:'past',confirmedAt:'2026-10-18T10:00:00Z'},{...baseOrder,id:'undated',status:'Ödeme alındı'},{...baseOrder,id:'done',status:'Teslim edildi',confirmedAt:'2026-10-18T22:00:00Z'},{...baseOrder,id:'cancel',status:'İptal'},{...baseOrder,id:'demo',demo:true}],new Date('2026-10-18T21:30:00Z'));
assert.equal(work.approval.length,3);assert.equal(work.payment.length,1);assert.equal(work.today.length,1);assert.equal(work.tomorrow.length,1);assert.equal(work.overdue.length,1);assert.equal(work.undated.length,1);
const Daily=load('components/daily-work.tsx').default;const overview=render(Daily,{orders:[baseOrder],updatedAt:'2026-10-19T06:00:00Z',onOpen:()=>{},onOrders:()=>{}});assert.ok(overview.includes('Günlük bekleyen işler')&&overview.includes('PR-ONE'));
console.log('PASS: Istanbul day boundaries, legacy approvals, current pending work, confirmed dates and demo/completed/cancelled exclusions.');

const {logFailure,failureResponse,ServiceFailure}=load('lib/diagnostics.ts'),logs=[];
const originalError=console.error,originalWarn=console.warn;
try{console.error=value=>logs.push(value);console.warn=value=>logs.push(value);const reference=logFailure('orders','save',Object.assign(new Error('PRIVATE customer phone address token'),{code:'23503'}),503);assert.match(reference,/^PRERR-[A-F0-9]{12}$/);assert.ok(!logs[0].includes('PRIVATE'));assert.equal(JSON.parse(logs[0]).code,'23503');const response=failureResponse('upload','upload',new ServiceFailure('PRIVATE','STORAGE_UPLOAD'),503,'Fotoğraf yüklenemedi.');assert.match(response.headers.get('X-Error-Reference'),/^PRERR-/);assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'private, no-store');}finally{console.error=originalError;console.warn=originalWarn;}
console.log('PASS: structured diagnostic correlation without raw exception text or private order fields.');
