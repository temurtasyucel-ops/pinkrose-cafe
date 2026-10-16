import type {Metadata} from 'next';
export const metadata:Metadata={alternates:{canonical:'https://www.pinkrosecafe.com.tr'}};
import Storefront from './storefront';
import {catalog} from '@/db/store';
export const dynamic='force-dynamic';
export default async function Page(){
 try{return <Storefront initialCatalog={await catalog()}/>;}
 catch{return <Storefront/>;}
}
