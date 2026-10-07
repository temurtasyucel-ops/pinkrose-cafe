import type {Product,Settings} from './types';
export const defaultHeroProducts=['cookie-1','cookie-5','cookie-3'];
export const heroImagePath=(value:unknown):value is string=>typeof value==='string'&&/^(\/api\/images\/[a-z0-9-]+|\/products\/[a-z0-9-]+\.webp)$/.test(value);
export function heroSettings(input:Settings,products:Product[],previous:Settings){
 const mode=input.heroMode??previous.heroMode??'collection';
 if(!['collection','product','custom'].includes(mode))throw Error('Ana sayfa görsel türünü seçin.');
 const productId=input.heroProductId??previous.heroProductId??'';
 const activeIds=products.filter(p=>p.active&&heroImagePath(p.image)).map(p=>p.id);
 const defaults=defaultHeroProducts.filter(id=>activeIds.includes(id));
 const ids=input.heroProductIds??previous.heroProductIds??(defaults.length?defaults:activeIds.slice(0,3));
 const image=input.heroImage??previous.heroImage??'';
 const rawAlt=input.heroAlt??previous.heroAlt??'';
 if(typeof rawAlt!=='string')throw Error('Görsel açıklaması yazın.');
 const alt=rawAlt.trim().slice(0,200);
 if(!Array.isArray(ids)||ids.length>3||ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)throw Error('En fazla üç farklı ana sayfa ürünü seçin.');
 if(typeof productId!=='string'||typeof image!=='string'||(image&&!heroImagePath(image)))throw Error('Ana sayfa fotoğrafını yükleme alanından seçin.');
 const active=(id:string)=>products.some(p=>p.id===id&&p.active&&heroImagePath(p.image));
 if(mode==='product'&&!active(productId))throw Error('Fotoğrafı bulunan, vitrinde açık bir ürün seçin.');
 if(mode==='collection'&&(ids.some(id=>!active(id))||(!ids.length&&activeIds.length>0)))throw Error('Seçkide fotoğrafı bulunan, vitrinde açık ürünler seçin.');
 if(mode==='custom'&&(!image||!alt))throw Error('Özel görseli yükleyin ve görsel açıklaması yazın.');
 return {heroMode:mode as 'collection'|'product'|'custom',heroProductId:productId,heroProductIds:ids,heroImage:image,heroAlt:alt};
}
export function heroSelection(settings:Partial<Settings>,products:Product[]){
 const available=products.filter(p=>p.active&&heroImagePath(p.image));
 const ids=settings.heroProductIds??defaultHeroProducts;
 const selected=ids.map(id=>available.find(p=>p.id===id)).filter((p):p is Product=>!!p);
 const collection=selected.length?selected:available.slice(0,3);
 const product=available.find(p=>p.id===settings.heroProductId);
 if(settings.heroMode==='custom'&&heroImagePath(settings.heroImage))return {mode:'custom' as const,image:settings.heroImage,alt:settings.heroAlt||'Pink Rose',products:[]};
 if(settings.heroMode==='product'&&product)return {mode:'product' as const,image:product.image,alt:product.name,products:[product]};
 return {mode:'collection' as const,image:'',alt:'',products:collection};
}
