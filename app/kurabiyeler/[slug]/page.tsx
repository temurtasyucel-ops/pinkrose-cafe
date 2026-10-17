import type {Metadata} from 'next';
import {notFound,permanentRedirect} from 'next/navigation';
import {cache} from 'react';
import Storefront from '../../storefront';
import {catalog} from '@/db/store';
import {findProduct,productPath,productSlug,siteOrigin} from '@/lib/storefront-pages';
const readCatalog=cache(catalog);
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params,c=await readCatalog(),p=findProduct(c.products,slug);
 if(!p)return {title:'Ürün bulunamadı | Pink Rose Cafe',robots:{index:false,follow:true}};
 const title=p.name+' | Pink Rose Cafe',description=p.description,url=siteOrigin+productPath(p),images=p.image?[{url:p.image,alt:p.name}]:[];
 return {title,description,alternates:{canonical:url},openGraph:{title,description,url,images},twitter:{title,description,images:p.image?[p.image]:[]}};
}
export default async function Page({params}:Props){
 const {slug}=await params,c=await readCatalog(),p=findProduct(c.products,slug);
 if(!p)notFound();
 if(slug!==productSlug(p))permanentRedirect(productPath(p));
 return <Storefront page="product" productId={p.id} initialCatalog={c}/>;
}
