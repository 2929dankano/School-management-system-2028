import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ModuleWorkspace from "./ModuleWorkspace";

const modules: Record<string, { title: string; description: string; allowed: string[] }> = {
  subscriptions: { title: "Subscriptions", description: "Subscription plans, school renewals, and payment status will be managed here.", allowed: ["super_admin"] },
  reports: { title: "Platform reports", description: "Platform-wide usage and revenue reporting will be available here.", allowed: ["super_admin"] },
  settings: { title: "Platform settings", description: "Manage approved platform-wide settings.", allowed: ["super_admin"] },
  students: { title: "Students", description: "Student registration, unique student numbers, class placement, and student records.", allowed: ["principal", "teacher"] },
  teachers: { title: "Teachers", description: "Register teachers, issue access codes, and assign classes and subjects.", allowed: ["principal"] },
  parents: { title: "Parents & children", description: "Invite parents and link each parent account to one or more students.", allowed: ["principal"] },
  classes: { title: "Classes & subjects", description: "View classes and subjects available to your role. Editing permissions depend on your role.", allowed: ["principal", "teacher"] },
  attendance: { title: "Attendance", description: "Record and review attendance for authorized classes and linked children.", allowed: ["principal", "teacher", "parent"] },
  results: { title: "Examinations & results", description: "Teachers can enter permitted results; principals control final approval and publication; parents can view published results for their own children.", allowed: ["principal", "teacher", "parent"] },
  fees: { title: "Fees & payments", description: "Review fee schedules and payment status. Sensitive payment verification is restricted to authorized school administration workflows.", allowed: ["principal", "parent"] },
  messages: { title: "Messages & reminders", description: "School messages, announcements, and PTA reminders for authorized recipients.", allowed: ["super_admin", "principal", "teacher", "parent"] },
  children: { title: "My children", description: "Your linked children's school information will appear here after the parent-child records are configured.", allowed: ["parent"] },
};

export default async function ModulePage({ params }: { params: { module: string } }) {
  const item = modules[params.module];
  if (!item) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/${params.module}`);
  const { data: profile } = await supabase.from("profiles").select("id,school_id,role,full_name,is_active").eq("id", user.id).maybeSingle();
  if (!profile || !profile.is_active) redirect("/login?error=account");
  if (!item.allowed.includes(profile.role)) return <div className="content"><div className="card"><div className="eyebrow">ACCESS RESTRICTED</div><h2>You do not have access to this section</h2><p className="sub">Your account role does not permit access to this page. This helps keep school and family information separated.</p><Link className="btn" href="/dashboard">Return to your dashboard</Link></div></div>;
  if (["students", "classes", "teachers", "parents", "attendance", "results", "fees", "messages", "children"].includes(params.module)) {
    return <ModuleWorkspace module={params.module} profile={profile} />;
  }
  return <div className="content"><div className="welcome"><div><div className="eyebrow">WORKSPACE MODULE</div><h2>{item.title}</h2><p className="sub">{item.description}</p></div><Link className="btn secondary" href="/dashboard">← Overview</Link></div><div className="card"><h2>Module foundation is ready</h2><p className="sub">This section still needs its complete database-backed workflow and acceptance tests.</p><div className="notice" style={{marginTop:18}}>No sample records are being presented as real school data.</div></div></div>;
}
