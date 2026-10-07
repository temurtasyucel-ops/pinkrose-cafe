export const defaultLeadDays=2;
export function validLeadDays(value:unknown):value is number{return Number.isInteger(value)&&Number(value)>=0&&Number(value)<=30;}
export function leadDays(settings:{leadDays?:number}){return validLeadDays(settings.leadDays)?settings.leadDays:defaultLeadDays;}
export function earliestOrderDate(days:number,now=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=(type:string)=>parts.find(p=>p.type===type)!.value;
 const date=new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00Z`);
 date.setUTCDate(date.getUTCDate()+days);
 return date.toISOString().slice(0,10);
}
export function validOrderDate(date:string,min:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const value=new Date(date+'T12:00:00Z');
 return Number.isFinite(value.getTime())&&value.toISOString().slice(0,10)===date&&date>=min;
}
export function deliveryPreference(date:unknown,time:unknown,days:number,language:'tr'|'en',now=new Date()){
 if(typeof date!=='string'||typeof time!=='string')throw Error('Geçerli tarih ve saat seçin.');
 if(date&&!validOrderDate(date,earliestOrderDate(days,now)))throw Error('Seçtiğiniz tarih hazırlık süresine uygun değil. Lütfen daha ileri bir tarih seçin.');
 if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Geçerli tarih ve saat seçin.');
 const formatted=date?new Intl.DateTimeFormat(language==='en'?'en-GB':'tr-TR',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(new Date(date+'T12:00:00Z')):'';
 return [formatted,time].filter(Boolean).join(' · ');
}
