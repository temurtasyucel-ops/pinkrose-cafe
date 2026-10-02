export function cleanCart(value:unknown):Record<string,number>{
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 const cart:Record<string,number>={};
 for(const [id,qty] of Object.entries(value))if(/^(cookie-\d|[a-z0-9-]{36})$/.test(id)&&typeof qty==='number'&&Number.isInteger(qty)&&qty>0)cart[id]=Math.min(qty,50);
 return cart;
}
export function submissionKey(previous:{payload:string;key:string}|null,payload:string,create:()=>string){return previous?.payload===payload?previous:{payload,key:create()};}
