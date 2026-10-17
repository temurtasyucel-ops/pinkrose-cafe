import type {Product} from './types';

export type ShopPage='home'|'cookies'|'box'|'events'|'story'|'product';
export const siteOrigin='https://www.pinkrosecafe.com.tr';
const knownSlugs:Record<string,string>={'cookie-1':'gulpembe','cookie-2':'ask-dedigin','cookie-3':'kara-sevda','cookie-4':'inci-tanem','cookie-5':'sah-mat','cookie-6':'findik-kiran','cookie-7':'kitirti','cookie-8':'sirine','cookie-9':'gonulcelen'};
export function slugText(value:string){return value.toLocaleLowerCase('tr-TR').replaceAll('ı','i').replaceAll('ğ','g').replaceAll('ü','u').replaceAll('ş','s').replaceAll('ö','o').replaceAll('ç','c').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function productSlug(p:Product){return knownSlugs[p.id]||`${slugText(p.name)||'kurabiye'}-${p.id}`;}
export function productPath(p:Product){return '/kurabiyeler/'+productSlug(p);}
export function findProduct(products:Product[],slug:string){return products.find(p=>p.active&&(productSlug(p)===slug||(!knownSlugs[p.id]&&slug.endsWith('-'+p.id))||(p.id==='cookie-9'&&slug==='pamuk-prenses')));}
export function homeSelection(products:Product[]){const active=products.filter(p=>p.active);return [...active.filter(p=>p.featured),...active.filter(p=>!p.featured)].slice(0,3);}
export const flavourFilters=[{id:'all',tr:'Tüm lezzetler',en:'All flavours'},{id:'chocolate',tr:'Yoğun çikolatalı',en:'Rich chocolate'},{id:'fruit',tr:'Meyveli',en:'Fruity'},{id:'nuts',tr:'Fındıklı / cevizli',en:'Hazelnut / walnut'}];
export function matchesFlavour(p:Product,id:string){const text=[p.ingredients,p.description,p.flavourNotes].join(' ').toLocaleLowerCase('tr-TR');if(id==='chocolate')return /bitter|kakao|dark chocolate|cocoa/.test(text);if(id==='fruit')return /vişne|limon|elma|sour cherry|lemon|apple/.test(text);if(id==='nuts')return /fındık|ceviz|hazelnut|walnut/.test(text);return true;}
