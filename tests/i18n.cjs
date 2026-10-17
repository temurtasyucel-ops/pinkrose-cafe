const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const cache=new Map();
function load(file){
 file=path.resolve(__dirname,'..',file);if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const localRequire=name=>name.startsWith('.')?load(path.relative(path.resolve(__dirname,'..'),path.resolve(path.dirname(file),name.endsWith('.ts')?name:name+'.ts'))):require(name);
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,module,module.exports);
 return module.exports;
}
const {translate,localContent,cleanEnglish}=load('lib/i18n.ts');
const {seed}=load('lib/seed.ts');
for(const p of seed.products){
 for(const field of ['description','ingredients','allergens','category']){
  assert.equal(localContent(p,field,p[field],'tr'),p[field]);
  assert.notEqual(localContent(p,field,p[field],'en'),p[field],p.name+' '+field);
 }
 assert.equal(localContent(p,'name',p.name,'en'),p.name);
}
for(const field of ['preparationText','paymentText','storageInfo','heatingInfo','deliveryText'])assert.notEqual(localContent(seed.settings,field,seed.settings[field],'en'),seed.settings[field]);
assert.equal(localContent({english:{description:'New seasonal filling'}},'description','Yeni dolgu','en'),'New seasonal filling');
assert.equal(localContent({english:{description:'New seasonal filling'}},'description','Yeni dolgu','tr'),'Yeni dolgu');
assert.equal(localContent({},'ingredients','Tarifi değişti','en'),'Tarifi değişti');
assert.equal(translate('İç dolgu için sola kaydır','en'),'Swipe left to see the filling');
assert.deepEqual(cleanEnglish({description:'  English  ',name:42,unknown:'Ignored'},['description','name']),{description:'English'});
assert.equal(cleanEnglish({description:'a'.repeat(2000)},['description']).description.length,1000);
console.log('PASS: English catalog and instructions, Turkish preservation, custom seasonal translations and bounded translation input.');
