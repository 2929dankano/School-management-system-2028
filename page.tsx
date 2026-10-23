import Link from "next/link";

const stats = [
  { label: "Total Students", value: "1,284", note: "+8.2% this term", icon: "♙" },
  { label: "Teaching Staff", value: "64", note: "Across all departments", icon: "♧" },
  { label: "Classes", value: "32", note: "Primary & secondary", icon: "▦" },
  { label: "Attendance Today", value: "94.6%", note: "Demo preview data", icon: "✓" },
];

const students = [
  { name: "Amina Yusuf", id: "SMS-2026-0012", className: "JSS 2 A", status: "Present" },
  { name: "Ibrahim Musa", id: "SMS-2026-0013", className: "SSS 1 B", status: "Present" },
  { name: "Maryam Bello", id: "SMS-2026-0014", className: "Primary 5", status: "Late" },
  { name: "Abdullahi Sani", id: "SMS-2026-0015", className: "JSS 3 A", status: "Present" },
];

export default function HomePage() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">S</div><div>SchoolFlow <small style={{display:"block",fontSize:10,fontWeight:500,color:"#91a8cc",marginTop:3}}>MANAGEMENT SYSTEM</small></div></div>
        <div><div className="nav-label">Workspace</div><nav className="nav">
          <a className="active" href="#overview"><span>▦</span> Overview</a>
          <a href="#students"><span>♙</span> Students</a><a href="#teachers"><span>♧</span> Teachers</a>
          <a href="#classes"><span>▤</span> Classes & Subjects</a><a href="#attendance"><span>✓</span> Attendance</a>
          <a href="#exams"><span>▧</span> Examinations</a><a href="#fees"><span>₦</span> Fees & Payments</a>
          <a href="#messages"><span>✉</span> Messages</a>
        </nav></div>
        <div className="sidebar-bottom">School Management System<br/>Responsive workspace preview<br/><span style={{color:"#718bb1"}}>Demo data · Not connected to a school</span></div>
      </aside>
      <main className="main">
        <header className="topbar"><div><div className="crumb">Workspace / Overview</div><div className="page-title">School Overview</div></div><div className="top-actions"><input className="search" placeholder="Search students, teachers…"/><div className="avatar">AD</div></div></header>
        <div className="content" id="overview">
          <div className="welcome"><div><div className="eyebrow">MONDAY, SCHOOL ADMINISTRATION</div><h2>Welcome back, Administrator 👋</h2><div className="sub">Here’s what’s happening across your school today.</div></div><Link className="btn" href="/login">↗ &nbsp; Open secure login</Link></div>
          <div className="notice"><strong>Preview mode:</strong> This is a fresh UI starter with illustrative data only. Login, database records, and school actions are not connected yet.</div>
          <section className="cards">{stats.map(s=><div className="card" key={s.label}><div className="stat-top"><span>{s.label}</span><div className="stat-icon">{s.icon}</div></div><div className="stat-value">{s.value}</div><div className="stat-note">{s.note}</div></div>)}</section>
          <section className="columns">
            <div className="card" id="students"><div className="panel-head"><div className="panel-title">Recently Registered Students</div><a className="panel-link" href="#students">View all →</a></div>
              <div className="table-wrap"><table className="table"><thead><tr><th>Student</th><th>Student ID</th><th>Class</th><th>Status</th></tr></thead><tbody>{students.map((s)=><tr key={s.id}><td><div className="student"><div className="mini-avatar">{s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div><div>{s.name}<small>Student profile</small></div></div></td><td>{s.id}</td><td>{s.className}</td><td><span className={`pill ${s.status==="Late"?"orange":""}`}>{s.status}</span></td></tr>)}</tbody></table></div>
            </div>
            <div className="card"><div className="panel-head"><div className="panel-title">School Activity</div><a className="panel-link" href="#messages">View all →</a></div>
              <div className="activity"><div className="activity-dot"></div><div><strong>Term 1 registration overview</strong><p>Student registration and class allocation will appear here once connected.</p></div></div>
              <div className="activity"><div className="activity-dot" style={{background:"#0d9488"}}></div><div><strong>Teacher workspace</strong><p>Teacher assignments and attendance tools are planned for the next phase.</p></div></div>
              <div className="activity"><div className="activity-dot" style={{background:"#f59e0b"}}></div><div><strong>Parent communication</strong><p>Announcements and PTA reminders will be connected to Supabase later.</p></div></div>
              <div className="bar-row"><span>Attendance</span><div className="bar"><span style={{width:"94.6%"}}/></div><b>95%</b></div>
              <div className="bar-row"><span>Fee collection</span><div className="bar"><span style={{width:"72%"}}/></div><b>72%</b></div>
            </div>
          </section>
          <div className="sub" style={{marginTop:20}}>Foundation build · Responsive for desktop and mobile · Data shown above is illustrative only.</div>
        </div>
      </main>
    </div>
  );
}
