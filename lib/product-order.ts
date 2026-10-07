import type {Product} from './types';
export function sortedProducts(products:Product[],order:unknown){
 const ids=Array.isArray(order)?order.filter((v):v is string=>typeof v==='string'):[];
 const ranks=new Map(ids.map((id,i)=>[id,i]));
 return [...products].sort((a,b)=>{
  const ar=ranks.get(a.id),br=ranks.get(b.id);
  if(ar!==undefined||br!==undefined)return (ar??Number.MAX_SAFE_INTEGER)-(br??Number.MAX_SAFE_INTEGER);
  return a.sort-b.sort||a.id.localeCompare(b.id);
 });
}
export function moveProduct(ids:string[],id:string,direction:number){const index=ids.indexOf(id),target=index+direction;if(index<0||![1,-1].includes(direction)||target<0||target>=ids.length)return [...ids];const result=[...ids];[result[index],result[target]]=[result[target],result[index]];return result;}
export function validateProductOrder(products:Product[],ids:unknown,expected:unknown){
 const current=products.map(p=>p.id);
 if(!Array.isArray(ids)||ids.length!==current.length||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!current.includes(id)))throw Error('Ürün sıralamasını kontrol edin.');
 if(!Array.isArray(expected)||JSON.stringify(expected)!==JSON.stringify(current))throw Error('Ürün listesi değişti. Yenileyip tekrar sıralayın.');
 return ids as string[];
}
