import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return <main className="login-wrap">
    <section className="login-art">
      <div className="brand"><div className="brand-mark">S</div><div>SchoolFlow <small style={{display:"block",fontSize:10,fontWeight:500,color:"#91a8cc",marginTop:3}}>SCHOOL MANAGEMENT</small></div></div>
      <div><div className="eyebrow" style={{color:"#91b4ff"}}>ONE SCHOOL. ONE WORKSPACE.</div><h1>Everything your school needs, in one place.</h1><p>Manage students, teachers, attendance, examinations, fees, and parent communication from one organized workspace.</p></div>
      <div className="form-note" style={{color:"#91a8cc"}}>Secure school operations · Role-based access · Mobile-ready</div>
    </section>
    <section className="login-box"><div className="login-form">
      <div className="eyebrow">WELCOME BACK</div><h2>Sign in to your account</h2><p className="sub">Use the email and password issued by your school administrator.</p>
      <LoginForm />
      <p className="form-note" style={{marginTop:18}}>Accounts must be created by an authorized administrator. Public registration is disabled.</p>
      <p className="form-note"><Link href="/">← Return to overview</Link></p>
    </div></section>
  </main>;
}
