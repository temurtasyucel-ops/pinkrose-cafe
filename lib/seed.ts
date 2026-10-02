import {defaultPaymentText} from './payment';
import {defaultPreparation,defaultStorage,defaultHeating} from './care';
import {Catalog,Product} from './types';
export const cookieNames=['Gülpembe','Aşk Dediğin','Kara Sevda','İnci Tanem','Şah Mat','Fındık Kıran','Kıtırtı'];
const flavors=[
 ['gulpembe','Pembe hamur, ceviz ve beyaz çikolata. İçinde akışkan beyaz çikolata dolgu.','Callebaut beyaz Belçika çikolatası, ceviz parçaları ve tereyağlı özel pembe hamur. Callebaut beyaz Belçika çikolatalı akışkan dolgu.'],
 ['ask-dedigin','Kırmızı kakaolu hamur ve beyaz çikolata. İçinde akışkan beyaz çikolata dolgu.','Callebaut beyaz Belçika çikolatası, kakao ve tereyağlı özel kırmızı hamur. Callebaut beyaz Belçika çikolatalı akışkan dolgu.'],
 ['kara-sevda','Yoğun bitter çikolata ve kakaolu hamur. İçinde el yapımı vişne dolgu.','Callebaut bitter Belçika çikolatası, kakao ve tereyağlı özel hamur. El yapımı vişne dolgu.'],
 ['inci-tanem','Beyaz çikolata, kakao ve Hindistan cevizi. İçinde Raffaello dolgu.','Callebaut beyaz Belçika çikolatası, kakao ve tereyağlı özel hamur. Hindistan cevizi tozu ve Raffaello dolgu.'],
 ['sah-mat','Bitter ve beyaz çikolatalı iki renkli hamur. İçinde Ferrero Rocher dolgu.','Callebaut bitter ve beyaz Belçika çikolatası, fındık parçaları ve tereyağlı özel dama hamur. Ferrero Rocher dolgu.'],
 ['findik-kiran','Bitter çikolata parçaları ve fındıklı hamur. İçinde Nutella ve fındıklı dolgu.','Callebaut bitter Belçika çikolatası, fındık parçaları ve tereyağlı özel hamur. Nutella ve fındıklı dolgu.'],
 ['kitirti','Tereyağlı hamur, bitter çikolata ve çıtır Nesquik. İçinde Nutella dolgu.','Callebaut bitter Belçika çikolatası ve tereyağlı özel hamur. Nesquik ve Nutellalı dolgu.']
];
export const realProducts:Product[]=flavors.map(([slug,description,ingredients],i)=>({id:`cookie-${i+1}`,name:cookieNames[i],category:'Kurabiyeler',description,ingredients,allergens:'Tam alerjen bilgisi için sipariş öncesinde bizimle iletişime geçin.',price:16000,oldPrice:0,image:`/products/${slug}-dis.webp`,insideImage:`/products/${slug}-ic.webp`,weight:'120–150 g',active:true,stock:true,boxEligible:true,featured:[0,2,4].includes(i),sort:i}));
export const defaultPackages=[{qty:2,name:'2’li Kutu',price:30000},{qty:4,name:'4’lü Keyif Kutusu',price:60000},{qty:6,name:'6’lı Ziyafet Kutusu',price:90000},{qty:8,name:'8’li Kutlama Kutusu',price:110000}];
export const seed:Catalog={categories:['Kurabiyeler'],settings:{paymentText:defaultPaymentText,preparationText:defaultPreparation,storageInfo:defaultStorage,heatingInfo:defaultHeating,whatsapp:'905060584705',instagram:'https://www.instagram.com/pinkrosecafe.tr/',deliveryText:'Gel-al ücretsizdir. Manisa ve İzmir için ücretli teslimat seçenekleri vardır. Teslimat ücreti adresinize göre sipariş onayında netleşir.',deliveryFee:0,deliveryQuoted:true,demo:true},campaigns:[],products:realProducts,packages:defaultPackages,tastingPrice:100000,tastingIds:realProducts.map(p=>p.id)};
