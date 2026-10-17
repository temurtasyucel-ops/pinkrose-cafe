import type {Metadata} from 'next';
import Storefront from '../storefront';
import {catalog} from '@/db/store';
const title='Kurabiyelerimiz'+' | Pink Rose Cafe',description='Pink Rose kurabiyelerini, dolguları ve güncel fiyatları keşfet. Callebaut Belçika çikolatası ve yayık tereyağıyla hazırlanır.',url='https://www.pinkrosecafe.com.tr/kurabiyeler';
export const metadata:Metadata={title,description,alternates:{canonical:url},openGraph:{title,description,url},twitter:{title,description}};
export const dynamic='force-dynamic';
export default async function Page(){try{return <Storefront page="cookies" initialCatalog={await catalog()}/>;}catch{return <Storefront page="cookies"/>;}}
