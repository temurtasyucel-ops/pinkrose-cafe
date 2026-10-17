import type {Language} from '@/lib/i18n';

export default function OrderNextSteps({language,demo,trackingAvailable}:{language:Language;demo:boolean;trackingAvailable:boolean}){
 const en=language==='en';
 if(demo)return <p>{en?'This is a test order. No payment is collected and no real delivery is made.':'Bu bir deneme siparişidir. Ödeme alınmaz ve gerçek teslimat yapılmaz.'}</p>;
 const steps=en?[
  ['Confirm on WhatsApp','We confirm your products, delivery time and final total together.'],
  ['Pay by bank transfer','We share the IBAN after confirmation. Your order is confirmed once we verify the payment.'],
  ['We prepare your order','Preparation starts after payment verification.'+(trackingAvailable?' Follow progress with your order status link.':' We confirm delivery arrangements on WhatsApp.')]
 ]:[
  ['WhatsApp’ta teyit','Ürünleri, teslim zamanını ve kesin toplamı birlikte netleştiriyoruz.'],
  ['Havale / EFT ile ödeme','Teyit sonrası IBAN paylaşıyoruz. Ödemenizi kontrol ettikten sonra siparişiniz kesinleşiyor.'],
  ['Özenle hazırlık','Ödeme kontrolünden sonra hazırlığa başlıyoruz.'+(trackingAvailable?' Aşağıdaki bağlantıdan sipariş durumunu görebilirsiniz.':' Teslimat detaylarını WhatsApp’ta netleştiriyoruz.')]
 ];
 return <div className="order-next-steps"><h3>{en?'What happens next?':'Şimdi ne olacak?'}</h3><ol>{steps.map(([title,description])=><li key={title}><b>{title}</b><span>{description}</span></li>)}</ol><p className="small-note">{en?'No payment is collected on this page.':'Bu sayfada ödeme alınmaz.'}</p></div>;
}
