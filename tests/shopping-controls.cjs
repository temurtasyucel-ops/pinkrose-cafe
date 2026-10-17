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
