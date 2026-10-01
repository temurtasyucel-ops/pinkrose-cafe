'use client';
import {useState,type FormEvent} from 'react';

export default function Login(){
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setBusy(true);
    const form=new FormData(event.currentTarget);
    try{
      const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.get('email'),password:form.get('password')})});
      const data=await response.json().catch(()=>({error:'Giriş tamamlanamadı. Lütfen tekrar deneyin.'}));
      if(!response.ok)throw Error(data.error || 'Giriş yapılamadı.');
      window.location.assign('/panel');
    }catch(e){setError((e as Error).message);setBusy(false);}
  }
  return <main className="message" style={{maxWidth:480,margin:'8vh auto',padding:28}}>
    <a href="/" className="wordmark">Pink Rose<span>CAFE</span></a>
    <h1>Yönetici girişi</h1><p>Atölyenizi yönetmek için giriş yapın.</p>
    <form onSubmit={submit} style={{display:'grid',gap:16,textAlign:'left'}}>
      <label>E-posta<input type="email" name="email" required autoComplete="username" style={{display:'block',width:'100%',padding:12,border:'1px solid #e8bbc9',borderRadius:10}}/></label>
      <label>Şifre<input type="password" name="password" required autoComplete="current-password" maxLength={256} style={{display:'block',width:'100%',padding:12,border:'1px solid #e8bbc9',borderRadius:10}}/></label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="primary-button" disabled={busy}>{busy?'Giriş yapılıyor…':'Giriş yap'}</button>
    </form>
  </main>;
}
