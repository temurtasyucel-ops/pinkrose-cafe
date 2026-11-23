import type {Campaign,Product} from './types';

export const vestelCampaignDefaults={
  slug:'vestel',
  singleItemPrice:15000,
  eventUnitPrice:12500,
  eventMinQty:8,
  packages:[{qty:2,price:30000},{qty:4,price:60000},{qty:6,price:80000},{qty:8,price:100000}]
} as const;

export type CampaignPriceResult={
  quantity:number;
  normalSubtotal:number;
  campaignTotal:number;
  savings:number;
  discountPercent:number;
  eventOrder:boolean;
  breakdown:{qty:number;unitPrice:number;lineTotal:number;label:string}[];
};

export function validCampaignPricing(value:unknown):value is NonNullable<Campaign['pricing']>{
  const p=value as Campaign['pricing']|undefined;
  return !!p&&Number.isSafeInteger(p.singleItemPrice)&&p.singleItemPrice>0&&
    Number.isSafeInteger(p.eventUnitPrice)&&p.eventUnitPrice>0&&
    Number.isSafeInteger(p.eventMinQty)&&p.eventMinQty>=1&&p.eventMinQty<=100&&
    Array.isArray(p.packages)&&p.packages.length===4&&
    p.packages.every((v,i)=>v.qty===[2,4,6,8][i]&&Number.isSafeInteger(v.price)&&v.price>0);
}

export function campaignPricing(campaign:Campaign,products:Product[],quantities:Record<string,number>,eventOrder=false):CampaignPriceResult{
  const config=validCampaignPricing(campaign.pricing)?campaign.pricing:vestelCampaignDefaults;
  const selected=products.filter(p=>p.active&&p.stock&&Number.isInteger(quantities[p.id])&&quantities[p.id]>0);
  if(!selected.length)throw new Error('En az bir ürün seçin.');
  if(selected.some(p=>!(p.boxEligible??/^cookie-[1-9]$/.test(p.id))))throw new Error('Kampanyaya uygun olmayan ürün seçildi.');
  const quantity=selected.reduce((sum,p)=>sum+quantities[p.id],0);
  if(quantity>100)throw new Error('Tek siparişte en fazla 100 ürün seçilebilir.');
  const normalSubtotal=selected.reduce((sum,p)=>sum+p.price*quantities[p.id],0);
  if(eventOrder){
    if(quantity<config.eventMinQty)throw new Error(`Etkinlik siparişi en az ${config.eventMinQty} adet olmalıdır.`);
    const requestedTotal=quantity*config.eventUnitPrice;
    const useNormal= requestedTotal>normalSubtotal;
    const campaignTotal=Math.min(requestedTotal,normalSubtotal);
    const breakdown=useNormal
      ? selected.map(p=>({qty:quantities[p.id],unitPrice:p.price,lineTotal:p.price*quantities[p.id],label:'Güncel normal fiyat'}))
      : [{qty:quantity,unitPrice:config.eventUnitPrice,lineTotal:requestedTotal,label:'Etkinlik siparişi'}];
    return {quantity,normalSubtotal,campaignTotal,savings:normalSubtotal-campaignTotal,discountPercent:normalSubtotal?(normalSubtotal-campaignTotal)/normalSubtotal*100:0,eventOrder:true,breakdown};
  }
  let remaining=quantity,requestedTotal=0;
  const breakdown:CampaignPriceResult['breakdown']=[];
  for(const pack of [...config.packages].sort((a,b)=>b.qty-a.qty)){
    const count=Math.floor(remaining/pack.qty);
    if(count>0){for(let n=0;n<count;n++)breakdown.push({qty:pack.qty,unitPrice:Math.round(pack.price/pack.qty),lineTotal:pack.price,label:`${pack.qty}’li paket`});requestedTotal+=count*pack.price;remaining-=count*pack.qty;}
  }
  if(remaining>0){const lineTotal=remaining*config.singleItemPrice;breakdown.push({qty:remaining,unitPrice:config.singleItemPrice,lineTotal,label:'Ek ürün'});requestedTotal+=lineTotal;}
  const useNormal=requestedTotal>normalSubtotal;
  const campaignTotal=Math.min(requestedTotal,normalSubtotal);
  const finalBreakdown=useNormal?selected.map(p=>({qty:quantities[p.id],unitPrice:p.price,lineTotal:p.price*quantities[p.id],label:'Güncel normal fiyat'})):breakdown;
  return {quantity,normalSubtotal,campaignTotal,savings:normalSubtotal-campaignTotal,discountPercent:normalSubtotal?(normalSubtotal-campaignTotal)/normalSubtotal*100:0,eventOrder:false,breakdown:finalBreakdown};
}
