import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const menuByRole: Record<string, { label: string; href: string; icon: string }[]> = {
  super_admin: [
    { label: "Platform overview", href: "/dashboard", icon: "▦" },
    { label: "Schools", href: "/dashboard/schools", icon: "⌂" },
    { label: "Subscriptions", href: "/dashboard/subscriptions", icon: "₦" },
    { label: "Platform reports", href: "/dashboard/reports", icon: "▤" },
    { label: "Settings", href: "/dashboard/settings", icon: "⚙" },
  ],
  principal: [
    { label: "School overview", href: "/dashboard", icon: "▦" },
    { label: "Students", href: "/dashboard/students", icon: "♙" },
    { label: "Teachers", href: "/dashboard/teachers", icon: "♧" },
    { label: "Parents & children", href: "/dashboard/parents", icon: "♙" },
    { label: "Classes & subjects", href: "/dashboard/classes", icon: "▤" },
    { label: "Attendance", href: "/dashboard/attendance", icon: "✓" },
    { label: "Examinations & results", href: "/dashboard/results", icon: "▧" },
    { label: "Fees & payments", href: "/dashboard/fees", icon: "₦" },
    { label: "Messages & reminders", href: "/dashboard/messages", icon: "✉" },
  ],
  teacher: [
    { label: "My workspace", href: "/dashboard", icon: "▦" },
    { label: "My classes", href: "/dashboard/classes", icon: "▤" },
    { label: "Attendance", href: "/dashboard/attendance", icon: "✓" },
    { label: "Results entry", href: "/dashboard/results", icon: "▧" },
    { label: "Messages", href: "/dashboard/messages", icon: "✉" },
  ],
  parent: [
    { label: "Parent overview", href: "/dashboard", icon: "▦" },
    { label: "My children", href: "/dashboard/children", icon: "♙" },
    { label: "Attendance", href: "/dashboard/attendance", icon: "✓" },
    { label: "Results", href: "/dashboard/results", icon: "▧" },
    { label: "Fees & payments", href: "/dashboard/fees", icon: "₦" },
    { label: "School messages", href: "/dashboard/messages", icon: "✉" },
  ],
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const { data: profile } = await supabase.from("profiles").select("full_name, role, is_active").eq("id", user.id).maybeSingle();
  if (!profile || !profile.is_active || !menuByRole[profile.role]) redirect("/login?error=account");
  const menu = menuByRole[profile.role];
  const initials = (profile.full_name || user.email || "U").split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part: string) => part[0].toUpperCase()).join("");

  return <div className="shell">
    <aside className="sidebar">
      <Link className="brand" href="/dashboard"><div className="brand-mark">S</div><div>SMS Portal<small style={{display:"block",fontSize:10,fontWeight:500,color:"#91a8cc",marginTop:3}}>SCHOOL MANAGEMENT</small></div></Link>
      <div><div className="nav-label">Your workspace</div><nav className="nav">{menu.map((item, index) => <Link key={item.href + item.label} className={index === 0 ? "active" : ""} href={item.href}><span>{item.icon}</span>{item.label}</Link>)}</nav></div>
      <div className="sidebar-bottom">Signed in as<br/><strong style={{color:"#fff"}}>{profile.full_name}</strong><br/><span style={{textTransform:"capitalize"}}>{profile.role.replace("_", " ")}</span><br/><form action="/auth/signout" method="post" style={{marginTop:12}}><button className="btn secondary" type="submit">Sign out</button></form></div>
    </aside>
    <main className="main"><header className="topbar"><div><div className="crumb">SMS Portal / Secure workspace</div><div className="page-title">{profile.role === "super_admin" ? "Platform Administration" : profile.role === "principal" ? "School Administration" : profile.role === "teacher" ? "Teacher Workspace" : "Parent Portal"}</div></div><div className="top-actions"><div className="avatar">{initials}</div></div></header>{children}</main>
  </div>;
}
