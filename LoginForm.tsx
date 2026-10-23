"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in. Please try again.");
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit}>
    <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required /></div>
    <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required /></div>
    {error && <p role="alert" style={{color:"#b42318",fontSize:12}}>{error}</p>}
    <button className="btn" style={{width:"100%",marginTop:10}} type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
  </form>;
}
