export async function readJson(response:Response){
 const data=await response.json().catch(()=>{throw Error('İşlem tamamlanamadı. Lütfen tekrar deneyin.');});
 if(!response.ok){const reference=typeof data?.reference==='string'&&/^PRERR-[A-F0-9]{12}$/.test(data.reference)?' (Hata kodu: '+data.reference+')':'';throw Error((typeof data?.error==='string'?data.error:'İşlem tamamlanamadı. Lütfen tekrar deneyin.')+reference);}
 return data;
}
