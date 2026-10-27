export function normalizePhoneForRateLimit(value:string){
 const digits=value.replace(/\D/g,'');
 if(/^0?5\d{9}$/.test(digits))return '90'+(digits.startsWith('0')?digits.slice(1):digits);
 if(/^905\d{9}$/.test(digits))return digits;
 return digits;
}
