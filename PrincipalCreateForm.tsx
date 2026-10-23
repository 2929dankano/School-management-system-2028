"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SchoolOption = { id: string; name: string; is_active: boolean };

export default function PrincipalCreateForm({ schools }: { schools: SchoolOption[] }) {
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
    const fullName = String(form.get("full_name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const schoolId = String(form.get("school_id") ?? "").trim();
    if (fullName.length < 2 || !email || !schoolId) {
      setError("Enter the Principal's name, email, and select a school.");
      setBusy(false);
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: invokeError } = await supabase.functions.invoke("create-principal", {
        body: { full_name: fullName, email, school_id: schoolId },
      });
      if (invokeError) throw new Error("The secure account service could not be reached. Confirm that the function is deployed, then try again.");
      if (!data?.success) throw new Error(typeof data?.error === "string" ? data.error : "The Principal account could not be created.");
      formElement.reset();
      setSuccess(`Invitation sent to ${email}. The account is linked to ${data.principal.school_name}.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create the Principal account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const activeSchools = schools.filter((school) => school.is_active);
  return (
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="principal-name">Principal full name *</label><input id="principal-name" name="full_name" required minLength={2} maxLength={160} /></div>
      <div className="field"><label htmlFor="principal-email">Principal email *</label><input id="principal-email" name="email" type="email" required maxLength={254} /></div>
      <div className="field"><label htmlFor="principal-school">School *</label><select id="principal-school" name="school_id" required defaultValue=""><option value="" disabled>Select a school</option>{activeSchools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></div>
      {activeSchools.length === 0 && <p className="sub">Register and activate a school before creating its Principal account.</p>}
      {error && <p role="alert" style={{ color: "#b42318", fontSize: 12 }}>{error}</p>}
      {success && <p role="status" style={{ color: "#067647", fontSize: 12 }}>{success}</p>}
      <button className="btn" type="submit" disabled={busy || activeSchools.length === 0}>{busy ? "Creating account…" : "Invite Principal"}</button>
    </form>
  );
}
