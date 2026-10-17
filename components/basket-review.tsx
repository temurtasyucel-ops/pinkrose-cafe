import type {ReactNode} from 'react';
import type {Language} from '@/lib/i18n';

export default function BasketReview({compact,count,total,deliveryNote,language,children}:{compact:boolean;count:number;total:string;deliveryNote:string;language:Language;children:ReactNode}){
 if(!compact)return <>{children}</>;
 const en=language==='en';
 return <details className="checkout-basket"><summary><span><b>{count} {en?'items':'ürün'} · {total}</b><small>{deliveryNote}</small></span><span className="checkout-basket-toggle">{en?'Basket details':'Sepet ayrıntıları'}</span></summary><div className="checkout-basket-content">{children}</div></details>;
}
