import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Metric = { label: string; value: number | null; note: string };

async function countRows(
  query: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number | null> {
  const result = await query;
  return result.error ? null : (result.count ?? 0);
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login?next=/dashboard");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, school_id, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return <main className="content"><div className="card"><h2>Profile not available</h2><p className="sub">Your account is signed in, but an authorized school profile was not found. Contact your school administrator.</p><Link className="btn" href="/login">Return to login</Link></div></main>;
  }
  if (!profile.is_active) {
    return <main className="content"><div className="card"><h2>Account disabled</h2><p className="sub">This account is currently disabled. Contact your school administrator.</p></div></main>;
  }

  const today = new Date().toISOString().slice(0, 10);
  let metrics: Metric[] = [];

  if (profile.role === "super_admin") {
    const [schools, accounts, principals, students] = await Promise.all([
      countRows(supabase.from("schools").select("id", { count: "exact", head: true })),
      countRows(supabase.from("profiles").select("id", { count: "exact", head: true })),
      countRows(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "principal")),
      countRows(supabase.from("students").select("id", { count: "exact", head: true })),
    ]);
    metrics = [
      { label: "Registered schools", value: schools, note: "Schools on the platform" },
      { label: "User accounts", value: accounts, note: "All profile records" },
      { label: "Principals", value: principals, note: "Principal accounts" },
      { label: "Students", value: students, note: "Across registered schools" },
    ];
  } else if (profile.role === "principal") {
    const [students, teachers, classes, attendance] = await Promise.all([
      countRows(supabase.from("students").select("id", { count: "exact", head: true })),
      countRows(supabase.from("teachers").select("id", { count: "exact", head: true })),
      countRows(supabase.from("classes").select("id", { count: "exact", head: true })),
      countRows(supabase.from("attendance").select("id", { count: "exact", head: true }).eq("attendance_date", today)),
    ]);
    metrics = [
      { label: "Students", value: students, note: "In your school" },
      { label: "Teachers", value: teachers, note: "School teacher records" },
      { label: "Classes", value: classes, note: "School classes" },
      { label: "Attendance today", value: attendance, note: "Attendance records for today" },
    ];
  } else if (profile.role === "teacher") {
    const [classes, students, attendance, results] = await Promise.all([
      countRows(supabase.from("classes").select("id", { count: "exact", head: true }).eq("class_teacher_id", user.id)),
      countRows(supabase.from("students").select("id", { count: "exact", head: true })),
      countRows(supabase.from("attendance").select("id", { count: "exact", head: true }).eq("attendance_date", today)),
      countRows(supabase.from("results").select("id", { count: "exact", head: true })),
    ]);
    metrics = [
      { label: "My classes", value: classes, note: "Classes assigned to you" },
      { label: "My students", value: students, note: "Students visible to your role" },
      { label: "Attendance today", value: attendance, note: "Authorized attendance records" },
      { label: "Results records", value: results, note: "Results visible to your role" },
    ];
  } else if (profile.role === "parent") {
    const { data: parentRecord } = await supabase.from("parents").select("id").eq("profile_id", user.id).maybeSingle();
    const [children, attendance, results, fees] = await Promise.all([
      parentRecord
        ? countRows(supabase.from("parent_students").select("student_id", { count: "exact", head: true }).eq("parent_id", parentRecord.id))
        : Promise.resolve(0),
      countRows(supabase.from("attendance").select("id", { count: "exact", head: true })),
      countRows(supabase.from("results").select("id", { count: "exact", head: true })),
      countRows(supabase.from("fees").select("id", { count: "exact", head: true })),
    ]);
    metrics = [
      { label: "Linked children", value: children, note: "Children linked to your account" },
      { label: "Attendance records", value: attendance, note: "For your linked children" },
      { label: "Results records", value: results, note: "For your linked children" },
      { label: "Fee records", value: fees, note: "For your linked children" },
    ];
  }

  const moduleLink = profile.role === "super_admin" ? "/dashboard/schools" : profile.role === "principal" ? "/dashboard/students" : profile.role === "teacher" ? "/dashboard/classes" : "/dashboard/children";
  const actionLabel = profile.role === "super_admin" ? "Manage schools" : profile.role === "principal" ? "Manage students" : profile.role === "teacher" ? "Open my classes" : "View my children";

  return <main className="content">
    <div className="welcome">
      <div><div className="eyebrow">AUTHENTICATED WORKSPACE</div><h2>Welcome, {profile.full_name}</h2><p className="sub">Your role: <strong>{profile.role.replace("_", " ")}</strong></p></div>
      <form action="/auth/signout" method="post"><button className="btn secondary" type="submit">Sign out</button></form>
    </div>
    <div className="notice">These figures are requested from the live Supabase database and are filtered by the database permissions for your account. A dash means that a count could not be loaded.</div>
    <section className="cards" aria-label="Live database summary">
      {metrics.map((metric) => <div className="card" key={metric.label}>
        <div className="stat-top">{metric.label}</div>
        <div className="stat-value">{metric.value === null ? "—" : metric.value.toLocaleString()}</div>
        <div className="stat-note">{metric.note}</div>
      </div>)}
    </section>
    <section className="card">
      <div className="eyebrow">NEXT ACTION</div>
      <h2>{profile.role === "super_admin" ? "Set up your first school" : profile.role === "principal" ? "Set up your school records" : profile.role === "teacher" ? "Review your assigned classes" : "Review your children's records"}</h2>
      <p className="sub">The dashboard is connected to the live database for these summary counts. Other sections are still being connected and tested; do not treat their placeholder screens as completed features.</p>
      <Link className="btn" href={moduleLink}>{actionLabel}</Link>
    </section>
    <p className="sub" style={{ marginTop: 18 }}>Signed in as {user.email ?? "an authenticated user"} · School access: {profile.school_id ? "assigned" : "platform-wide"} · Account status: active</p>
  </main>;
}
