import type {MetadataRoute} from 'next';
import {catalog} from '@/db/store';
import {siteOrigin,productPath} from '@/lib/storefront-pages';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const pages=['','/kurabiyeler','/kutunu-olustur','/kutlama-etkinlik','/hikayemiz','/linkler'];
 const result:MetadataRoute.Sitemap=pages.map(path=>({url:siteOrigin+path,changeFrequency:'weekly',priority:path?0.8:1}));
 try{const c=await catalog();for(const p of c.products.filter(product=>product.active))result.push({url:siteOrigin+productPath(p),changeFrequency:'weekly',priority:0.7});}catch{}
 return result;
}
