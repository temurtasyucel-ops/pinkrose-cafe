import {redirect} from 'next/navigation';
import {admin,AdminError} from '@/lib/admin';
import AdminPanel from './panel';
export const dynamic='force-dynamic';
export default async function Page(){
  try{await admin();}catch(e){if(e instanceof AdminError&&[401,403].includes(e.status))redirect('/panel/login');throw e;}
  return <AdminPanel/>;
}
