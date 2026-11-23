import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {catalog} from '@/db/store';
import {liveCampaign} from '@/lib/types';
import CampaignStorefront from '@/components/campaign-storefront';

export const dynamic='force-dynamic';
export async function generateMetadata():Promise<Metadata>{
 return {title:'Vestel Çalışanlarına Özel | Pink Rose Cafe',robots:{index:false,follow:false}};
}
export default async function CampaignPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const c=await catalog();
 const campaign=c.campaigns.find(v=>v.slug===slug&&liveCampaign(v));
 if(!campaign)notFound();
 return <CampaignStorefront campaign={campaign} products={c.products.filter(p=>p.active&&p.stock&&(p.boxEligible??/^cookie-[1-9]$/.test(p.id)))} whatsapp={c.settings.whatsapp}/>;
}
