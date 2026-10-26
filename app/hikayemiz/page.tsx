import type {Metadata} from 'next';
import Storefront from '../storefront';
import {catalog} from '@/db/store';
const title='Hikâyemiz | Pink Rose Cafe',description='Pink Rose Cafe’nin Manisa’da başlayan hikâyesini, el yapımı cookie ve kurabiyelere yaklaşımını ve siparişe özel hazırlık anlayışını keşfet.',url='https://www.pinkrosecafe.com.tr/hikayemiz';
export const metadata:Metadata={title,description,alternates:{canonical:url},openGraph:{title,description,url},twitter:{title,description}};
export const dynamic='force-dynamic';
export default async function Page(){try{return <Storefront page="story" initialCatalog={await catalog()}/>;}catch{return <Storefront page="story"/>;}}
