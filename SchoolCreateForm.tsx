"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SchoolCreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError("");
    setSuccess("");

    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const address = String(form.get("address") ?? "").trim();

    if (name.length < 2) {
      setError("Enter the school name (at least 2 characters).");
      setBusy(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const schoolCode = `SCH-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
      const { error: insertError } = await supabase.from("schools").insert({
        name,
        school_code: schoolCode,
        email: email || null,
        phone: phone || null,
        address: address || null,
        is_active: true,
      });
      if (insertError) throw insertError;
      formElement.reset();
      setSuccess(`School created successfully. School code: ${schoolCode}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create the school. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="school-name">School name *</label><input id="school-name" name="name" required minLength={2} maxLength={160} /></div>
      <div className="field"><label htmlFor="school-email">School email</label><input id="school-email" name="email" type="email" maxLength={254} /></div>
      <div className="field"><label htmlFor="school-phone">Phone number</label><input id="school-phone" name="phone" type="tel" maxLength={40} /></div>
      <div className="field"><label htmlFor="school-address">Address</label><input id="school-address" name="address" maxLength={300} /></div>
      {error && <p role="alert" style={{ color: "#b42318", fontSize: 12 }}>{error}</p>}
      {success && <p role="status" style={{ color: "#067647", fontSize: 12 }}>{success}</p>}
      <button className="btn" type="submit" disabled={busy}>{busy ? "Creating school…" : "Create school"}</button>
    </form>
  );
}
