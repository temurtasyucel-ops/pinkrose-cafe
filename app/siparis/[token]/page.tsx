import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import TrackingPage from '@/components/order-tracking';
import {trackingPath} from '@/lib/order-tracking';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Sipariş Takibi | Pink Rose Cafe',robots:{index:false,follow:false,nocache:true},referrer:'no-referrer'};
export default async function Page({params}:{params:Promise<{token:string}>}){const {token}=await params;if(!trackingPath(token))notFound();return <TrackingPage token={token}/>;}
