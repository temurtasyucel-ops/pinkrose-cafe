import {z} from 'zod';

const supabaseUrlSchema=z.string().trim().url().refine(value=>{
  const url=new URL(value);
  return url.protocol==='https:' || (url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname));
});
const keySchema=z.string().trim().min(1).refine(value=>!/\s/.test(value));

function parse<T>(schema:z.ZodType<T>,value:unknown,message:string):T{
  const result=schema.safeParse(value);
  if(!result.success)throw new Error(message);
  return result.data;
}

export function supabaseUrl(){
  return parse(supabaseUrlSchema,process.env.NEXT_PUBLIC_SUPABASE_URL,'NEXT_PUBLIC_SUPABASE_URL eksik veya geçersiz.');
}

export function supabasePublishableKey(){
  return parse(keySchema,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY eksik veya geçersiz.');
}

export function supabaseSecretKey(){
  const value=process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return parse(keySchema,value,'SUPABASE_SECRET_KEY (veya eski SUPABASE_SERVICE_ROLE_KEY) eksik veya geçersiz.');
}
