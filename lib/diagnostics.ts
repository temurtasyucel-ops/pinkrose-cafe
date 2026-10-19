export class ServiceFailure extends Error{constructor(message:string,public code?:string){super(message);this.name='ServiceFailure';}}
export function logFailure(scope:string,stage:string,error:unknown,status:number){
 const reference='PRERR-'+crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase();
 const value=error as {code?:unknown;name?:unknown}|null;
 const code=typeof value?.code==='string'&&/^(?:[A-Z0-9]{5}|PGRST\d{3}|STORAGE_[A-Z_]{1,24}|ETIMEDOUT|ECONNRESET)$/.test(value.code)?value.code:undefined;
 const type=['Error','TypeError','SyntaxError','ServiceFailure','AdminError'].includes(String(value?.name))?String(value?.name):'Error';
 const entry={event:'operation_failed',reference,scope,stage,status,type,code,at:new Date().toISOString()};
 // No raw exception messages, stacks, request bodies, filenames or customer data.
 if(status>=500)console.error(JSON.stringify(entry));else console.warn(JSON.stringify(entry));
 return reference;
}
export function failureResponse(scope:string,stage:string,error:unknown,status:number,message:string){const reference=logFailure(scope,stage,error,status);return Response.json({error:message,reference},{status,headers:{'Cache-Control':'private, no-store','X-Error-Reference':reference}});}
