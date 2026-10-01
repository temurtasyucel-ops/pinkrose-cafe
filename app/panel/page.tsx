import {redirect} from 'next/navigation';
import {admin} from '@/lib/admin';
import AdminPanel from './panel';
export const dynamic='force-dynamic';
export default async function Page(){
  try{await admin();}catch{redirect('/panel/login');}
  return <AdminPanel/>;
}
