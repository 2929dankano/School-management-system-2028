import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SchoolCreateForm from "./SchoolCreateForm";
import PrincipalCreateForm from "./PrincipalCreateForm";

export const dynamic = "force-dynamic";

type SchoolRow = {
  id: string;
  name: string;
  school_code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
};

export default async function SchoolsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?next=/dashboard/schools");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) redirect("/login?error=account");
  if (profile.role !== "super_admin") redirect("/dashboard");

  const { data, error: schoolsError } = await supabase
    .from("schools")
    .select("id, name, school_code, email, phone, address, is_active, created_at")
    .order("created_at", { ascending: false });
  const schools = (data ?? []) as SchoolRow[];

  return (
    <div className="content">
      <div className="welcome">
        <div><div className="eyebrow">PLATFORM ADMINISTRATION</div><h2>Schools</h2><p className="sub">Register schools and review the school directory.</p></div>
      </div>
      <div className="columns" style={{ alignItems: "start" }}>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Register a school</h2>
          <p className="sub">A unique school code will be generated automatically.</p>
          <SchoolCreateForm />
        </section>
        <section className="card">
          <div className="welcome" style={{ marginBottom: 12 }}><div><h2 style={{ marginTop: 0 }}>School directory</h2><p className="sub">{schools.length} school{schools.length === 1 ? "" : "s"} registered</p></div></div>
          {schoolsError ? (
            <div className="notice" role="alert">The school list could not be loaded. Check the database permissions and try again.</div>
          ) : schools.length === 0 ? (
            <div className="notice">No schools have been registered yet. Use the form to add the first school.</div>
          ) : (
            <div className="table-wrap"><table className="table"><thead><tr><th>School</th><th>Code</th><th>Contact</th><th>Status</th></tr></thead><tbody>
              {schools.map((school) => <tr key={school.id}>
                <td><strong>{school.name}</strong><br /><span className="sub">{school.address || "No address added"}</span></td>
                <td>{school.school_code}</td>
                <td>{school.email || school.phone || "—"}</td>
                <td><span className={school.is_active ? "pill" : "pill orange"}>{school.is_active ? "Active" : "Inactive"}</span></td>
              </tr>)}
            </tbody></table></div>
          )}
        </section>
      </div>
      <div className="columns" style={{ alignItems: "start", marginTop: 18 }}>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Create Principal account</h2>
          <p className="sub">The Principal receives an email invitation to set up access. The account is linked to one selected school.</p>
          <PrincipalCreateForm schools={schools.map(({ id, name, is_active }) => ({ id, name, is_active }))} />
        </section>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Access and security</h2>
          <p className="sub">Principal account creation runs through a protected Supabase Edge Function. The server checks the signed-in Super Admin, confirms the school is active, and creates the Principal profile without exposing a service-role key to the browser.</p>
        </section>
      </div>
    </div>
  );
}
