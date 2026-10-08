import type {Product} from '@/lib/types';
import {calorieEstimate} from '@/lib/nutrition';
export default function ProductNutrition({product,english=false,detail=false}:{product:Product;english?:boolean;detail?:boolean}){
 const calories=calorieEstimate(product);
 if(!product.weight&&!calories)return null;
 return <div className="product-nutrition">{product.weight&&<strong>{product.weight}</strong>}{calories&&<small>≈{calories} kcal / {english?'cookie':'adet'}</small>}{detail&&calories&&<p>{english?'Values are calculated from the recipe and may vary with weight and filling quantity.':'Değerler tarif üzerinden hesaplanmıştır; gramaj ve dolgu miktarına göre değişebilir.'}</p>}</div>;
}
