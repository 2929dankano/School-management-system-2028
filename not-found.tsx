import Link from "next/link";
export default function NotFound() {
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,textAlign:"center"}}>
    <div><div className="eyebrow">404 · PAGE NOT FOUND</div><h1 style={{fontSize:36}}>We can’t find that page.</h1><p className="sub">The page may have moved or does not exist in this starter.</p><Link className="btn" href="/">Back to overview</Link></div>
  </main>;
}
