import type {Metadata} from 'next';
import Storefront from '../storefront';
import {catalog} from '@/db/store';
const title='Kutunu Oluştur'+' | Pink Rose Cafe',description='Kutu boyunu seç, Pink Rose kurabiyelerini dilediğin gibi karıştır. Güncel fiyatlarla kendi kutunu hazırla.',url='https://www.pinkrosecafe.com.tr/kutunu-olustur';
export const metadata:Metadata={title,description,alternates:{canonical:url},openGraph:{title,description,url},twitter:{title,description}};
export const dynamic='force-dynamic';
export default async function Page(){try{return <Storefront page="box" initialCatalog={await catalog()}/>;}catch{return <Storefront page="box"/>;}}
