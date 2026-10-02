export async function readJson(response:Response){
 const data=await response.json().catch(()=>{throw Error('İşlem tamamlanamadı. Lütfen tekrar deneyin.');});
 if(!response.ok)throw Error(typeof data?.error==='string'?data.error:'İşlem tamamlanamadı. Lütfen tekrar deneyin.');
 return data;
}
