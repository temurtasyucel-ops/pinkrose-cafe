import type {Metadata} from 'next';
import Storefront from '../storefront';
import {catalog} from '@/db/store';
const title='Kutlama & Etkinlik'+' | Pink Rose Cafe',description='Doğum günü, ofis ikramı ve etkinlikler için Pink Rose toplu sipariş talebini paylaş. Adet ve tarihi birlikte planlayalım.',url='https://www.pinkrosecafe.com.tr/kutlama-etkinlik';
export const metadata:Metadata={title,description,alternates:{canonical:url},openGraph:{title,description,url},twitter:{title,description}};
export const dynamic='force-dynamic';
export default async function Page(){try{return <Storefront page="events" initialCatalog={await catalog()}/>;}catch{return <Storefront page="events"/>;}}
