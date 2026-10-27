'use client';

export default function GlobalError({reset}:{error:Error & {digest?:string};reset:()=>void}){
  return <html lang="tr"><body style={{margin:0,fontFamily:'system-ui, sans-serif',background:'#fff7fb',color:'#4b1225'}}>
    <main role="alert" style={{minHeight:'100vh',display:'grid',placeContent:'center',gap:12,padding:24,textAlign:'center'}}>
      <p style={{margin:0,color:'#a80000',fontWeight:700,letterSpacing:'.12em'}}>PINK ROSE CAFE</p>
      <h1 style={{margin:'8px 0',fontSize:'clamp(1.8rem,5vw,2.6rem)'}}>Kısa bir aksaklık oldu.</h1>
      <p style={{maxWidth:460,lineHeight:1.7,margin:'0 auto'}}>Sayfa beklenmedik bir sorunla karşılaştı. Yeniden deneyebilir veya ana sayfaya dönebilirsiniz.</p>
      <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginTop:12}}>
        <button onClick={reset} style={{border:0,borderRadius:999,padding:'12px 20px',background:'#a80000',color:'#fff',font:'inherit',cursor:'pointer'}}>Tekrar dene</button>
        <a href="/" style={{border:'1px solid #e5b7c8',borderRadius:999,padding:'12px 20px',color:'#a80000',textDecoration:'none'}}>Ana sayfaya dön</a>
      </div>
    </main>
  </body></html>;
}
