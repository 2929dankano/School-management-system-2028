"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = { id: string; school_id: string | null; role: string; full_name?: string };
type Row = Record<string, unknown>;

const titles: Record<string, string> = {
  students: "Students", classes: "Classes & subjects", teachers: "Teachers", attendance: "Attendance",
  results: "Examinations & results", fees: "Fees & payments", messages: "Messages & reminders", children: "My children",
};

export default function ModuleWorkspace({ module, profile }: { module: string; profile: Profile }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [classes, setClasses] = useState<Row[]>([]);
  const [teachers, setTeachers] = useState<Row[]>([]);
  const [recipients, setRecipients] = useState<Row[]>([]);
  const [students, setStudents] = useState<Row[]>([]);
  const [subjects, setSubjects] = useState<Row[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<Row[]>([]);
  const [childAttendance, setChildAttendance] = useState<Row[]>([]);
  const [childResults, setChildResults] = useState<Row[]>([]);
  const [childFees, setChildFees] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [createdTeacherCode, setCreatedTeacherCode] = useState("");
  const writable = profile.role === "principal";

  async function load() {
    setLoading(true); setError("");
    try {
      const db = createSupabaseBrowserClient();
      if (module === "parents") {
        const { data: parentRows, error: pe } = await db.from("parents").select("id,created_at,profiles(full_name,email),parent_students(student_id)").order("created_at", { ascending: false }).limit(300);
        if (pe) throw pe;
        setRows((parentRows ?? []) as Row[]);
        const { data: studentRows, error: se } = await db.from("students").select("id,student_number,first_name,last_name").order("first_name").limit(500);
        if (se) throw se;
        setStudents((studentRows ?? []) as Row[]);
      } else if (module === "teachers") {
        const { data: teacherRows, error: te } = await db.from("teachers").select("id,staff_number,employment_status,joined_at,profiles(full_name,email)").order("created_at", { ascending: false }).limit(300);
        if (te) throw te;
        setRows((teacherRows ?? []) as Row[]);
      } else if (module === "fees") {
        const { data: feeRows, error: fe } = await db.from("fees").select("id,student_id,description,amount,amount_paid,due_date,status,created_at,students(first_name,last_name,student_number)").order("created_at", { ascending: false }).limit(300);
        if (fe) throw fe;
        setRows((feeRows ?? []) as Row[]);
        const { data: studentRows, error: se } = await db.from("students").select("id,student_number,first_name,last_name").order("first_name").limit(500);
        if (se) throw se;
        setStudents((studentRows ?? []) as Row[]);
      } else if (module === "results") {
        const { data: resultRows, error: re } = await db.from("results").select("id,student_id,subject,term,academic_year,score,remarks,approved_by,approved_at,created_at,students(first_name,last_name,student_number)").order("created_at", { ascending: false }).limit(300);
        if (re) throw re;
        setRows((resultRows ?? []) as Row[]);
        const { data: studentRows, error: se } = await db.from("students").select("id,student_number,first_name,last_name,class_id").order("first_name").limit(500);
        if (se) throw se;
        setStudents((studentRows ?? []) as Row[]);
      } else if (module === "attendance") {
        const { data: attendanceRows, error: ae } = await db.from("attendance").select("id,student_id,attendance_date,status,note,students(first_name,last_name,student_number)").order("attendance_date", { ascending: false }).limit(250);
        if (ae) throw ae;
        setRows((attendanceRows ?? []) as Row[]);
        const { data: studentRows, error: se } = await db.from("students").select("id,student_number,first_name,last_name,class_id").order("first_name").limit(500);
        if (se) throw se;
        setStudents((studentRows ?? []) as Row[]);
      } else if (module === "messages") {
        const { data: messages, error: me } = await db.from("school_messages").select("id,subject,body,audience_type,status,scheduled_at,sent_at,created_at").order("created_at", { ascending: false }).limit(100);
        if (me) throw me;
        const { data: events, error: ee } = await db.from("school_events").select("id,title,description,event_type,event_at,target_audience,status,created_at").order("event_at", { ascending: true }).limit(100);
        if (ee) throw ee;
        setRows([...(messages ?? []).map((r: Row) => ({ ...r, record_type: "Message" })), ...(events ?? []).map((r: Row) => ({ ...r, subject: r.title, scheduled_at: r.event_at, audience_type: r.target_audience, record_type: "Event / reminder" }))] as Row[]);
        if (["principal", "teacher"].includes(profile.role) && profile.school_id) {
          const { data: people, error: pe } = await db.from("profiles").select("id,full_name,email,role").eq("school_id", profile.school_id).eq("is_active", true).in("role", ["teacher", "parent"]).order("full_name");
          if (pe) throw pe;
          setRecipients((people ?? []) as Row[]);
        } else { setRecipients([]); }
      } else if (module === "students") {
        const { data, error: e } = await db.from("students").select("id,student_number,first_name,middle_name,last_name,class_id,admission_date,status,classes(name)").order("created_at", { ascending: false }).limit(200);
        if (e) throw e;
        setRows((data ?? []) as Row[]);
        const { data: classData, error: ce } = await db.from("classes").select("id,name,level,academic_year").order("name");
        if (ce) throw ce;
        setClasses((classData ?? []) as Row[]);
      } else if (module === "classes") {
        const { data, error: e } = await db.from("classes").select("id,name,level,academic_year,class_teacher_id").order("name");
        if (e) throw e;
        setRows((data ?? []) as Row[]);
        const { data: teacherData, error: te } = await db.from("profiles").select("id,full_name").eq("role", "teacher").eq("school_id", profile.school_id).eq("is_active", true).order("full_name");
        if (te) throw te;
        setTeachers((teacherData ?? []) as Row[]);
        const { data: subjectData, error: se } = await db.from("subjects").select("id,name,subject_code,description,is_active").order("name");
        if (se) throw se;
        setSubjects((subjectData ?? []) as Row[]);
        const { data: assignmentData, error: ase } = await db.from("class_subjects").select("id,class_id,subject_id,teacher_profile_id,classes(name,academic_year),subjects(name,subject_code),profiles(full_name)").order("created_at", { ascending: false });
        if (ase) throw ase;
        setSubjectAssignments((assignmentData ?? []) as Row[]);
      } else if (module === "children") {
        const { data: childData, error: childError } = await db.from("students").select("id,student_number,first_name,middle_name,last_name,class_id,admission_date,status,classes(name,academic_year)").order("first_name").limit(100);
        if (childError) throw childError;
        setRows((childData ?? []) as Row[]);
        const [attendanceResult, resultResult, feeResult] = await Promise.all([
          db.from("attendance").select("id,student_id,attendance_date,status,note").order("attendance_date", { ascending: false }).limit(500),
          db.from("results").select("id,student_id,subject,term,academic_year,score,remarks,approved_at").order("created_at", { ascending: false }).limit(500),
          db.from("fees").select("id,student_id,description,amount,amount_paid,due_date,status").order("created_at", { ascending: false }).limit(500),
        ]);
        if (attendanceResult.error) throw attendanceResult.error;
        if (resultResult.error) throw resultResult.error;
        if (feeResult.error) throw feeResult.error;
        setChildAttendance((attendanceResult.data ?? []) as Row[]);
        setChildResults((resultResult.data ?? []) as Row[]);
        setChildFees((feeResult.data ?? []) as Row[]);
      } else {
        const table: "students" | "teachers" | "attendance" | "results" | "fees" = module === "children" ? "students" : module as "teachers" | "attendance" | "results" | "fees";
        const { data, error: e } = await db.from(table).select("*").limit(100);
        if (e) throw e;
        setRows((data ?? []) as Row[]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load records. Check your access and connection.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [module, profile.school_id]);

  async function createStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; if (!profile.school_id) { setError("This account is not linked to a school."); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData(event.currentTarget);
    const first_name = String(form.get("first_name") ?? "").trim();
    const middle_name = String(form.get("middle_name") ?? "").trim();
    const last_name = String(form.get("last_name") ?? "").trim();
    if (!first_name || !last_name) { setError("Enter the student's first and last name."); setBusy(false); return; }
    const student_number = `STU-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("students").insert({ school_id: profile.school_id, student_number, first_name, middle_name: middle_name || null, last_name, class_id: String(form.get("class_id") ?? "") || null, date_of_birth: String(form.get("date_of_birth") ?? "") || null, gender: String(form.get("gender") ?? "") || null, admission_date: String(form.get("admission_date") ?? "") || new Date().toISOString().slice(0,10), status: "active" });
      if (e) throw e;
      formElement.reset(); setSuccess(`Student registered. Unique student number: ${student_number}`); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to register this student."); }
    finally { setBusy(false); }
  }

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; if (!profile.school_id) { setError("This account is not linked to a school."); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const academic_year = String(form.get("academic_year") ?? "").trim();
    if (!name || !academic_year) { setError("Enter class name and academic year."); setBusy(false); return; }
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("classes").insert({ school_id: profile.school_id, name, level: String(form.get("level") ?? "").trim() || null, academic_year, class_teacher_id: String(form.get("class_teacher_id") ?? "") || null });
      if (e) throw e;
      formElement.reset(); setSuccess("Class created successfully."); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create this class."); }
    finally { setBusy(false); }
  }







  async function createSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget;
    if (profile.role !== "principal" || !profile.school_id) { setError("Only the Principal can create subjects."); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const subject_code = String(form.get("subject_code") ?? "").trim().toUpperCase();
    const description = String(form.get("description") ?? "").trim();
    if (name.length < 1 || subject_code.length < 1) { setError("Enter a subject name and code."); setBusy(false); return; }
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("subjects").insert({ school_id: profile.school_id, name, subject_code, description: description || null });
      if (e) throw e;
      formElement.reset(); setSuccess("Subject created successfully."); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create this subject."); }
    finally { setBusy(false); }
  }

  async function assignSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget;
    if (profile.role !== "principal" || !profile.school_id) { setError("Only the Principal can assign subjects."); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData(formElement);
    const class_id = String(form.get("class_id") ?? "");
    const subject_id = String(form.get("subject_id") ?? "");
    const teacher_profile_id = String(form.get("teacher_profile_id") ?? "") || null;
    if (!class_id || !subject_id) { setError("Choose a class and subject."); setBusy(false); return; }
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("class_subjects").insert({ school_id: profile.school_id, class_id, subject_id, teacher_profile_id });
      if (e) throw e;
      formElement.reset(); setSuccess("Subject assigned to the class."); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error && /duplicate|unique/i.test(cause.message) ? "This subject is already assigned to that class." : cause instanceof Error ? cause.message : "Unable to assign this subject."); }
    finally { setBusy(false); }
  }

  async function editSubject(subject: Row) {
    if (profile.role !== "principal") { setError("Only the Principal can edit subjects."); return; }
    const name = window.prompt("Subject name", String(subject.name ?? ""));
    if (name === null) return;
    const subject_code = window.prompt("Subject code", String(subject.subject_code ?? ""));
    if (subject_code === null) return;
    const description = window.prompt("Description (leave blank for none)", String(subject.description ?? ""));
    if (description === null) return;
    if (!name.trim() || !subject_code.trim()) { setError("Subject name and code are required."); return; }
    setBusy(true); setError(""); setSuccess("");
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("subjects").update({ name: name.trim(), subject_code: subject_code.trim().toUpperCase(), description: description.trim() || null, updated_at: new Date().toISOString() }).eq("id", String(subject.id));
      if (e) throw e;
      setSuccess("Subject updated."); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update subject."); }
    finally { setBusy(false); }
  }

  async function toggleSubject(subject: Row) {
    if (profile.role !== "principal") { setError("Only the Principal can change subject status."); return; }
    const next = !Boolean(subject.is_active);
    if (!window.confirm(`${next ? "Reactivate" : "Deactivate"} ${String(subject.name)}?`)) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("subjects").update({ is_active: next, updated_at: new Date().toISOString() }).eq("id", String(subject.id));
      if (e) throw e;
      setSuccess(`Subject ${next ? "reactivated" : "deactivated"}.`); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to change subject status."); }
    finally { setBusy(false); }
  }

  async function removeSubjectAssignment(id: string) {
    if (profile.role !== "principal") { setError("Only the Principal can remove subject assignments."); return; }
    if (!window.confirm("Remove this subject from the class?")) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("class_subjects").delete().eq("id", id);
      if (e) throw e;
      setSuccess("Subject assignment removed."); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to remove the assignment."); }
    finally { setBusy(false); }
  }

  async function inviteParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget;
    if (profile.role !== "principal" || !profile.school_id) { setError("Only the Principal can add parents for this school."); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData(formElement);
    const full_name = String(form.get("full_name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const student_ids = form.getAll("student_ids").map(String);
    try {
      const db = createSupabaseBrowserClient();
      const { data, error: e } = await db.functions.invoke("create-parent", { body: { full_name, email, student_ids } });
      if (e) throw e;
      if (!data?.success) throw new Error(data?.error ?? "Parent creation was not completed.");
      formElement.reset(); setSuccess(`Parent invitation created. ${Number(data.parent?.child_count ?? student_ids.length)} child record(s) linked. Email delivery must be tested.`); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create parent account."); }
    finally { setBusy(false); }
  }

  async function inviteTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget;
    if (profile.role !== "principal" || !profile.school_id) { setError("Only the Principal can invite teachers for this school."); return; }
    setBusy(true); setError(""); setSuccess(""); setCreatedTeacherCode("");
    const form = new FormData(formElement);
    const full_name = String(form.get("full_name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    try {
      const db = createSupabaseBrowserClient();
      const { data, error: e } = await db.functions.invoke("create-teacher", { body: { full_name, email } });
      if (e) throw e;
      if (!data?.success) throw new Error(data?.error ?? "The teacher invitation was not completed.");
      formElement.reset(); setCreatedTeacherCode(String(data.teacher?.staff_number ?? "")); setSuccess("Teacher account created and invitation request accepted. Check email delivery before relying on first login."); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to invite this teacher."); }
    finally { setBusy(false); }
  }

  async function createFee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget;
    if (!profile.school_id || profile.role !== "principal") { setError("Only the Principal can create fee records."); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData(formElement);
    const student_id = String(form.get("student_id") ?? "");
    const description = String(form.get("description") ?? "").trim();
    const amount = Number(form.get("amount"));
    const due_date = String(form.get("due_date") ?? "");
    if (!student_id || !description || !Number.isFinite(amount) || amount < 0) { setError("Choose a student, describe the fee, and enter a valid amount."); setBusy(false); return; }
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("fees").insert({ school_id: profile.school_id, student_id, description, amount, amount_paid: 0, due_date: due_date || null, status: "unpaid", recorded_by: profile.id });
      if (e) throw e;
      formElement.reset(); setSuccess("Fee record created."); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create the fee record."); }
    finally { setBusy(false); }
  }

  async function recordPayment(feeId: string, amount: number, currentPaid: number) {
    if (profile.role !== "principal") { setError("Only the Principal can update payment records."); return; }
    const raw = window.prompt(`Total amount received so far (fee amount ${amount}).`, String(currentPaid));
    if (raw === null) return;
    const paid = Number(raw);
    if (!Number.isFinite(paid) || paid < 0 || paid > amount) { setError("Amount paid must be between 0 and the total fee amount."); return; }
    setBusy(true); setError(""); setSuccess("");
    const status = paid === 0 ? "unpaid" : paid >= amount ? "paid" : "partial";
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("fees").update({ amount_paid: paid, status }).eq("id", feeId);
      if (e) throw e;
      setSuccess("Payment record updated."); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update payment record."); }
    finally { setBusy(false); }
  }

  async function saveResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget;
    if (!profile.school_id || !["principal", "teacher"].includes(profile.role)) { setError("Only authorized school staff can enter results."); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData(formElement);
    const student_id = String(form.get("student_id") ?? "");
    const subject = String(form.get("subject") ?? "").trim();
    const term = String(form.get("term") ?? "").trim();
    const academic_year = String(form.get("academic_year") ?? "").trim();
    const score = Number(form.get("score"));
    const remarks = String(form.get("remarks") ?? "").trim();
    if (!student_id || !subject || !term || !academic_year || !Number.isFinite(score) || score < 0 || score > 100) { setError("Complete all required fields. Score must be between 0 and 100."); setBusy(false); return; }
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("results").insert({ school_id: profile.school_id, student_id, subject, term, academic_year, score, remarks: remarks || null, entered_by: profile.id });
      if (e) throw e;
      formElement.reset(); setSuccess("Result saved as unapproved. The Principal must approve it before parents can view it."); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save this result."); }
    finally { setBusy(false); }
  }

  async function approveResult(resultId: string) {
    if (profile.role !== "principal") { setError("Only the Principal can approve results."); return; }
    setBusy(true); setError(""); setSuccess("");
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("results").update({ approved_by: profile.id, approved_at: new Date().toISOString() }).eq("id", resultId);
      if (e) throw e;
      setSuccess("Result approved and published to the linked parent account."); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to approve this result."); }
    finally { setBusy(false); }
  }

  async function saveAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget;
    if (!profile.school_id || !["principal", "teacher"].includes(profile.role)) { setError("Only authorized school staff can record attendance."); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData(formElement);
    const student_id = String(form.get("student_id") ?? "");
    const attendance_date = String(form.get("attendance_date") ?? "");
    const status = String(form.get("status") ?? "present");
    const note = String(form.get("note") ?? "").trim();
    if (!student_id || !attendance_date) { setError("Choose a student and attendance date."); setBusy(false); return; }
    try {
      const db = createSupabaseBrowserClient();
      const { error: e } = await db.from("attendance").upsert({ school_id: profile.school_id, student_id, attendance_date, status, note: note || null, recorded_by: profile.id }, { onConflict: "school_id,student_id,attendance_date" });
      if (e) throw e;
      formElement.reset(); setSuccess("Attendance saved successfully."); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save attendance."); }
    finally { setBusy(false); }
  }

  async function createMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget;
    if (!profile.school_id || !["principal", "teacher"].includes(profile.role)) { setError("Only authorized school staff can send school messages."); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData(formElement);
    const subject = String(form.get("subject") ?? "").trim();
    const body = String(form.get("body") ?? "").trim();
    const audience_type = String(form.get("audience_type") ?? "selected");
    if (audience_type === "all" && profile.role !== "principal") { setError("Only the Principal can message all school users."); setBusy(false); return; }
    const chosen = form.getAll("recipient_ids").map(String);
    if (!subject || !body) { setError("Enter both subject and message."); setBusy(false); return; }
    try {
      const db = createSupabaseBrowserClient();
      const { data: msg, error: me } = await db.from("school_messages").insert({ school_id: profile.school_id, sender_profile_id: profile.id, subject, body, audience_type, status: "draft" }).select("id").single();
      if (me) throw me;
      let targetIds = chosen;
      if (audience_type !== "selected") targetIds = recipients.filter(r => audience_type === "all" || r.role === (audience_type === "teachers" ? "teacher" : "parent")).map(r => String(r.id));
      if (targetIds.length) {
        const inserts = targetIds.map(recipient_profile_id => ({ school_id: profile.school_id, message_id: msg.id, recipient_profile_id }));
        const { error: re } = await db.from("school_message_recipients").insert(inserts);
        if (re) throw re;
      }
      formElement.reset(); setSuccess(`Message saved. ${targetIds.length} recipient record(s) queued as pending; automatic delivery is not enabled yet.`); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save the message."); }
    finally { setBusy(false); }
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget;
    if (!profile.school_id || profile.role !== "principal") { setError("Only the Principal can create school events and PTA reminders."); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData(formElement);
    const title = String(form.get("title") ?? "").trim();
    const event_at = String(form.get("event_at") ?? "");
    const description = String(form.get("description") ?? "").trim();
    const chosen = form.getAll("event_recipient_ids").map(String);
    if (!title || !event_at) { setError("Enter an event title and date/time."); setBusy(false); return; }
    try {
      const db = createSupabaseBrowserClient();
      const { data: ev, error: ee } = await db.from("school_events").insert({ school_id: profile.school_id, created_by: profile.id, title, description: description || null, event_type: String(form.get("event_type") ?? "pta"), event_at: new Date(event_at).toISOString(), target_audience: "selected", status: "scheduled" }).select("id").single();
      if (ee) throw ee;
      if (chosen.length) {
        const { error: re } = await db.from("school_event_recipients").insert(chosen.map(recipient_profile_id => ({ school_id: profile.school_id, event_id: ev.id, recipient_profile_id })));
        if (re) throw re;
      }
      formElement.reset(); setSuccess(`Reminder saved for ${new Date(event_at).toLocaleString()}. ${chosen.length} parent/teacher recipient record(s) queued; automatic email/SMS delivery is not enabled yet.`); await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save the reminder."); }
    finally { setBusy(false); }
  }

  return <div className="content">
    <div className="welcome"><div><div className="eyebrow">LIVE SCHOOL RECORDS</div><h2>{titles[module] ?? module}</h2><p className="sub">Records shown here come from Supabase and are filtered by database permissions for your signed-in account.</p></div><button className="btn secondary" onClick={() => void load()} disabled={loading}>Refresh</button></div>
    {error && <div className="notice" role="alert" style={{borderColor:"#f0b4ae",color:"#9b1c1c",marginBottom:16}}>{error}</div>}
    {success && <div className="notice" role="status" style={{borderColor:"#a6e3c3",color:"#067647",marginBottom:16}}>{success}</div>}
    {module === "students" && <>
      {writable && <div className="card" style={{marginBottom:20}}><h3>Register a student</h3><p className="sub">A unique student number is generated automatically after successful registration.</p><form onSubmit={createStudent} className="form-grid">
        <div className="field"><label>First name *</label><input name="first_name" required maxLength={100}/></div><div className="field"><label>Middle name</label><input name="middle_name" maxLength={100}/></div><div className="field"><label>Last name *</label><input name="last_name" required maxLength={100}/></div>
        <div className="field"><label>Date of birth</label><input name="date_of_birth" type="date"/></div><div className="field"><label>Gender</label><select name="gender" defaultValue=""><option value="">Choose</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div><div className="field"><label>Class</label><select name="class_id" defaultValue=""><option value="">Not assigned</option>{classes.map(c=><option key={String(c.id)} value={String(c.id)}>{String(c.name)}{c.level ? ` — ${String(c.level)}` : ""}</option>)}</select></div><div className="field"><label>Admission date</label><input name="admission_date" type="date"/></div>
        <div style={{gridColumn:"1 / -1"}}><button className="btn" disabled={busy}>{busy ? "Saving…" : "Register student"}</button></div>
      </form></div>}
      <div className="card"><h3>Student directory</h3><div className="field" style={{maxWidth:420,marginTop:12}}><label htmlFor="student-search">Search by student name or number</label><input id="student-search" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Type name or student number…"/></div>{loading ? <p className="sub">Loading records…</p> : rows.filter(r=>[r.student_number,r.first_name,r.middle_name,r.last_name].filter(Boolean).join(" ").toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? <p className="sub">No matching student records are visible.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Student number</th><th>Name</th><th>Class</th><th>Admission date</th><th>Status</th></tr></thead><tbody>{rows.filter(r=>[r.student_number,r.first_name,r.middle_name,r.last_name].filter(Boolean).join(" ").toLowerCase().includes(searchTerm.toLowerCase())).map(r=><tr key={String(r.id)}><td>{String(r.student_number ?? "—")}</td><td>{[r.first_name,r.middle_name,r.last_name].filter(Boolean).join(" ")}</td><td>{String((r.classes as {name?:string}|null)?.name ?? "—")}</td><td>{String(r.admission_date ?? "—")}</td><td>{String(r.status ?? "—")}</td></tr>)}</tbody></table></div>}</div>
    </>}
    {module === "classes" && <>
      {writable && <div className="card" style={{marginBottom:20}}><h3>Create a class</h3><form onSubmit={createClass} className="form-grid"><div className="field"><label>Class name *</label><input name="name" required maxLength={100} placeholder="Primary 1 A"/></div><div className="field"><label>Level / stage</label><input name="level" maxLength={80} placeholder="Primary 1"/></div><div className="field"><label>Academic year *</label><input name="academic_year" required maxLength={30} placeholder="2026/2027"/></div><div className="field"><label>Class teacher</label><select name="class_teacher_id" defaultValue=""><option value="">Not assigned</option>{teachers.map(t=><option key={String(t.id)} value={String(t.id)}>{String(t.full_name)}</option>)}</select></div><div style={{gridColumn:"1 / -1"}}><button className="btn" disabled={busy}>{busy ? "Saving…" : "Create class"}</button></div></form></div>}
      <div className="card" style={{marginBottom:20}}><h3>Subjects</h3>{writable && <><p className="sub">Create a subject once, then assign it to one or more classes and teachers.</p><form onSubmit={createSubject} className="form-grid"><div className="field"><label>Subject name *</label><input name="name" required maxLength={120} placeholder="Mathematics"/></div><div className="field"><label>Subject code *</label><input name="subject_code" required maxLength={30} placeholder="MATH"/></div><div className="field" style={{gridColumn:"1 / -1"}}><label>Description</label><input name="description" maxLength={1000}/></div><div><button className="btn" disabled={busy}>{busy ? "Saving…" : "Create subject"}</button></div></form></>}{loading ? <p className="sub">Loading subjects…</p> : subjects.length === 0 ? <p className="sub">No subjects created yet.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Subject</th><th>Code</th><th>Description</th><th>Status</th>{writable && <th>Actions</th>}</tr></thead><tbody>{subjects.map(r=><tr key={String(r.id)}><td>{String(r.name)}</td><td>{String(r.subject_code)}</td><td>{String(r.description ?? "—")}</td><td>{r.is_active ? "Active" : "Inactive"}</td>{writable && <td><div style={{display:"flex",gap:8}}><button className="btn secondary" disabled={busy} onClick={()=>void editSubject(r)}>Edit</button><button className="btn secondary" disabled={busy} onClick={()=>void toggleSubject(r)}>{r.is_active ? "Deactivate" : "Reactivate"}</button></div></td>}</tr>)}</tbody></table></div>}</div>
      {writable && <div className="card" style={{marginBottom:20}}><h3>Assign subject to class and teacher</h3><form onSubmit={assignSubject} className="form-grid"><div className="field"><label>Class *</label><select name="class_id" required defaultValue=""><option value="">Choose class</option>{rows.map(c=><option key={String(c.id)} value={String(c.id)}>{String(c.name)} — {String(c.academic_year)}</option>)}</select></div><div className="field"><label>Subject *</label><select name="subject_id" required defaultValue=""><option value="">Choose subject</option>{subjects.filter(s=>s.is_active).map(s=><option key={String(s.id)} value={String(s.id)}>{String(s.name)} ({String(s.subject_code)})</option>)}</select></div><div className="field"><label>Teacher</label><select name="teacher_profile_id" defaultValue=""><option value="">Not assigned</option>{teachers.map(t=><option key={String(t.id)} value={String(t.id)}>{String(t.full_name)}</option>)}</select></div><div><button className="btn" disabled={busy}>{busy ? "Saving…" : "Assign subject"}</button></div></form></div>}
      <div className="card" style={{marginBottom:20}}><h3>Class directory</h3>{loading ? <p className="sub">Loading classes…</p> : rows.length === 0 ? <p className="sub">No class records are visible yet.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Class</th><th>Level</th><th>Academic year</th><th>Assigned teacher</th></tr></thead><tbody>{rows.map(r=><tr key={String(r.id)}><td>{String(r.name ?? "—")}</td><td>{String(r.level ?? "—")}</td><td>{String(r.academic_year ?? "—")}</td><td>{String(teachers.find(t=>String(t.id)===String(r.class_teacher_id))?.full_name ?? "Not assigned")}</td></tr>)}</tbody></table></div>}</div>
      <div className="card"><h3>Subject assignments</h3>{loading ? <p className="sub">Loading assignments…</p> : subjectAssignments.length === 0 ? <p className="sub">No subject assignments yet.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Class</th><th>Subject</th><th>Teacher</th>{writable && <th>Action</th>}</tr></thead><tbody>{subjectAssignments.map(r=>{const c=r.classes as {name?:string;academic_year?:string}|null;const s=r.subjects as {name?:string;subject_code?:string}|null;const t=r.profiles as {full_name?:string}|null;return <tr key={String(r.id)}><td>{String(c?.name??"—")} ({String(c?.academic_year??"—")})</td><td>{String(s?.name??"—")} ({String(s?.subject_code??"—")})</td><td>{String(t?.full_name??"Not assigned")}</td>{writable && <td><button className="btn secondary" disabled={busy} onClick={()=>void removeSubjectAssignment(String(r.id))}>Remove</button></td>}</tr>})}</tbody></table></div>}</div>
    </>}
    {module === "parents" && <>
      {profile.role === "principal" && <div className="card" style={{marginBottom:20}}><h3>Add parent and link children</h3><p className="sub">One parent account can be linked to several children. The server verifies that every selected child belongs to this school.</p><form onSubmit={inviteParent} className="form-grid"><div className="field"><label>Parent / guardian name *</label><input name="full_name" required minLength={2} maxLength={160}/></div><div className="field"><label>Email address *</label><input name="email" type="email" required maxLength={254}/></div><div className="field" style={{gridColumn:"1 / -1"}}><label>Select child or children *</label><select name="student_ids" multiple required size={Math.min(8,Math.max(4,students.length))} style={{width:"100%",boxSizing:"border-box"}}>{students.map(s=><option key={String(s.id)} value={String(s.id)}>{String(s.student_number)} — {String(s.first_name)} {String(s.last_name)}</option>)}</select><small className="sub">Select every child this parent is authorized to view.</small></div><div><button className="btn" disabled={busy}>{busy ? "Creating…" : "Create parent and link children"}</button></div></form></div>}
      <div className="card"><h3>Parent accounts</h3>{loading ? <p className="sub">Loading parents…</p> : rows.length === 0 ? <p className="sub">No parent accounts are visible yet.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Parent / guardian</th><th>Email</th><th>Linked children</th><th>Created</th></tr></thead><tbody>{rows.map(r=>{const p=r.profiles as {full_name?:string;email?:string}|null;const linked=Array.isArray(r.parent_students)?r.parent_students as Row[]:[];return <tr key={String(r.id)}><td>{String(p?.full_name??"—")}</td><td>{String(p?.email??"—")}</td><td>{linked.length}</td><td>{String(r.created_at??"—")}</td></tr>})}</tbody></table></div>}</div>
    </>}
    {module === "teachers" && <>
      {profile.role === "principal" && <div className="card" style={{marginBottom:20}}><h3>Add / invite a teacher</h3><p className="sub">An account invitation is sent to the teacher email. The system also creates a unique staff number. This staff number is not yet a login/access code; first-login code activation remains unfinished. Invitation delivery must be verified with the configured Supabase email provider.</p><form onSubmit={inviteTeacher} className="form-grid"><div className="field"><label>Teacher full name *</label><input name="full_name" required minLength={2} maxLength={160}/></div><div className="field"><label>Teacher email *</label><input name="email" type="email" required maxLength={254}/></div><div><button className="btn" disabled={busy}>{busy ? "Creating…" : "Create teacher and invite"}</button></div></form>{createdTeacherCode && <div className="notice" style={{marginTop:16}}>Teacher staff number (not a login code): <strong>{createdTeacherCode}</strong></div>}</div>}
      <div className="card"><h3>Teacher directory</h3>{loading ? <p className="sub">Loading teachers…</p> : rows.length === 0 ? <p className="sub">No teacher records are visible yet.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Staff number</th><th>Name</th><th>Email</th><th>Status</th><th>Joined</th></tr></thead><tbody>{rows.map(r=>{const p=r.profiles as {full_name?:string;email?:string}|null;return <tr key={String(r.id)}><td>{String(r.staff_number??"—")}</td><td>{String(p?.full_name??"—")}</td><td>{String(p?.email??"—")}</td><td>{String(r.employment_status??"—")}</td><td>{String(r.joined_at??"—")}</td></tr>})}</tbody></table></div>}</div>
    </>}
    {module === "fees" && <>
      {profile.role === "principal" && <div className="card" style={{marginBottom:20}}><h3>Create a fee record</h3><form onSubmit={createFee} className="form-grid"><div className="field"><label>Student *</label><select name="student_id" required defaultValue=""><option value="">Choose student</option>{students.map(s=><option key={String(s.id)} value={String(s.id)}>{String(s.student_number)} — {String(s.first_name)} {String(s.last_name)}</option>)}</select></div><div className="field"><label>Fee description *</label><input name="description" required maxLength={180} placeholder="First term school fees"/></div><div className="field"><label>Total amount *</label><input name="amount" type="number" min="0" step="0.01" required/></div><div className="field"><label>Due date</label><input name="due_date" type="date"/></div><div><button className="btn" disabled={busy}>{busy ? "Saving…" : "Create fee"}</button></div></form></div>}
      <div className="card"><h3>Fees and payment status</h3>{loading ? <p className="sub">Loading fee records…</p> : rows.length === 0 ? <p className="sub">No fee records are visible to this account yet.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Student</th><th>Description</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Due date</th><th>Status</th>{profile.role === "principal" && <th>Action</th>}</tr></thead><tbody>{rows.map(r=>{const st=r.students as {first_name?:string;last_name?:string;student_number?:string}|null;const amount=Number(r.amount??0);const paid=Number(r.amount_paid??0);return <tr key={String(r.id)}><td>{String(st?.student_number??"—")} — {[st?.first_name,st?.last_name].filter(Boolean).join(" ")}</td><td>{String(r.description??"—")}</td><td>{amount.toLocaleString()}</td><td>{paid.toLocaleString()}</td><td>{Math.max(0,amount-paid).toLocaleString()}</td><td>{String(r.due_date??"—")}</td><td>{String(r.status??"—")}</td>{profile.role === "principal" && <td><button className="btn secondary" disabled={busy} onClick={()=>void recordPayment(String(r.id),amount,paid)}>Record payment</button></td>}</tr>})}</tbody></table></div>}</div>
    </>}
    {module === "results" && <>
      {["principal", "teacher"].includes(profile.role) && <div className="card" style={{marginBottom:20}}><h3>Enter exam result</h3><p className="sub">Results are saved as unapproved. Only the Principal can approve and publish them to parents.</p><form onSubmit={saveResult} className="form-grid"><div className="field"><label>Student *</label><select name="student_id" required defaultValue=""><option value="">Choose student</option>{students.map(s=><option key={String(s.id)} value={String(s.id)}>{String(s.student_number)} — {String(s.first_name)} {String(s.last_name)}</option>)}</select></div><div className="field"><label>Subject *</label><input name="subject" required maxLength={120}/></div><div className="field"><label>Term *</label><select name="term" required defaultValue=""><option value="">Choose term</option><option value="First Term">First Term</option><option value="Second Term">Second Term</option><option value="Third Term">Third Term</option></select></div><div className="field"><label>Academic year *</label><input name="academic_year" required maxLength={30} placeholder="2026/2027"/></div><div className="field"><label>Score (0–100) *</label><input name="score" type="number" min="0" max="100" step="0.01" required/></div><div className="field"><label>Remarks</label><input name="remarks" maxLength={500}/></div><div><button className="btn" disabled={busy}>{busy ? "Saving…" : "Save result"}</button></div></form></div>}
      <div className="card"><h3>Results</h3>{loading ? <p className="sub">Loading results…</p> : rows.length === 0 ? <p className="sub">No results are visible to this account yet.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Student</th><th>Subject</th><th>Term / year</th><th>Score</th><th>Publication</th>{profile.role === "principal" && <th>Action</th>}</tr></thead><tbody>{rows.map(r=>{const st=r.students as {first_name?:string;last_name?:string;student_number?:string}|null;return <tr key={String(r.id)}><td>{String(st?.student_number ?? "—")} — {[st?.first_name,st?.last_name].filter(Boolean).join(" ")}</td><td>{String(r.subject ?? "—")}</td><td>{String(r.term ?? "—")} / {String(r.academic_year ?? "—")}</td><td>{String(r.score ?? "—")}</td><td>{r.approved_at ? "Approved / published" : "Awaiting Principal approval"}</td>{profile.role === "principal" && <td>{r.approved_at ? "Published" : <button className="btn" disabled={busy} onClick={()=>void approveResult(String(r.id))}>Approve</button>}</td>}</tr>})}</tbody></table></div>}</div>
    </>}
    {module === "attendance" && <>
      {["principal", "teacher"].includes(profile.role) && <div className="card" style={{marginBottom:20}}><h3>Record attendance</h3><p className="sub">One attendance record per student per date. Teacher access is restricted by database rules to assigned classes.</p><form onSubmit={saveAttendance} className="form-grid"><div className="field"><label>Student *</label><select name="student_id" required defaultValue=""><option value="">Choose student</option>{students.map(s=><option key={String(s.id)} value={String(s.id)}>{String(s.student_number)} — {String(s.first_name)} {String(s.last_name)}</option>)}</select></div><div className="field"><label>Date *</label><input name="attendance_date" type="date" required defaultValue={new Date().toISOString().slice(0,10)}/></div><div className="field"><label>Status *</label><select name="status" defaultValue="present"><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="excused">Excused</option></select></div><div className="field"><label>Note</label><input name="note" maxLength={500}/></div><div><button className="btn" disabled={busy}>{busy ? "Saving…" : "Save attendance"}</button></div></form></div>}
      <div className="card"><h3>Attendance records</h3>{loading ? <p className="sub">Loading records…</p> : rows.length === 0 ? <p className="sub">No attendance records are visible to this account yet.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Date</th><th>Student number</th><th>Student</th><th>Status</th><th>Note</th></tr></thead><tbody>{rows.map(r=>{const st=r.students as {first_name?:string;last_name?:string;student_number?:string}|null;return <tr key={String(r.id)}><td>{String(r.attendance_date ?? "—")}</td><td>{String(st?.student_number ?? "—")}</td><td>{[st?.first_name,st?.last_name].filter(Boolean).join(" ") || "—"}</td><td>{String(r.status ?? "—")}</td><td>{String(r.note ?? "—")}</td></tr>})}</tbody></table></div>}</div>
    </>}
    {module === "messages" && <>
      {["principal", "teacher"].includes(profile.role) && <div className="card" style={{marginBottom:20}}><h3>Send a school message</h3><p className="sub">The message and selected recipients are stored securely. Delivery stays pending until an email/SMS provider is configured and tested.</p><form onSubmit={createMessage} className="form-grid"><div className="field"><label>Subject *</label><input name="subject" required maxLength={180}/></div><div className="field"><label>Recipients *</label><select name="audience_type" defaultValue="parents">{profile.role === "principal" && <option value="all">All teachers and parents</option>}<option value="teachers">Teachers</option><option value="parents">Parents</option><option value="selected">Choose specific people below</option></select></div><div className="field" style={{gridColumn:"1 / -1"}}><label>Message *</label><textarea name="body" required maxLength={10000} rows={4} style={{width:"100%",boxSizing:"border-box"}}/></div><div className="field" style={{gridColumn:"1 / -1"}}><label>Specific recipients (used when “Choose specific people” is selected)</label><select name="recipient_ids" multiple size={Math.min(6, Math.max(3, recipients.length))} style={{width:"100%",boxSizing:"border-box"}}>{recipients.map(r=><option key={String(r.id)} value={String(r.id)}>{String(r.full_name)} — {String(r.role)}</option>)}</select><small className="sub">On a phone, tap to select the required recipients.</small></div><div><button className="btn" disabled={busy}>{busy ? "Saving…" : "Save message"}</button></div></form></div>}
      {profile.role === "principal" && <div className="card" style={{marginBottom:20}}><h3>PTA / school reminder</h3><form onSubmit={createEvent} className="form-grid"><div className="field"><label>Title *</label><input name="title" required maxLength={180} placeholder="PTA meeting"/></div><div className="field"><label>Type</label><select name="event_type" defaultValue="pta"><option value="pta">PTA</option><option value="meeting">Meeting</option><option value="exam">Exam</option><option value="holiday">Holiday</option><option value="event">School event</option><option value="reminder">Reminder</option></select></div><div className="field"><label>Date and time *</label><input name="event_at" type="datetime-local" required/></div><div className="field"><label>Description</label><input name="description" maxLength={2000}/></div><div className="field" style={{gridColumn:"1 / -1"}}><label>Select recipients</label><select name="event_recipient_ids" multiple size={Math.min(6, Math.max(3, recipients.length))} style={{width:"100%",boxSizing:"border-box"}}>{recipients.filter(r=>r.role === "parent").map(r=><option key={String(r.id)} value={String(r.id)}>{String(r.full_name)}</option>)}</select></div><div><button className="btn" disabled={busy}>{busy ? "Saving…" : "Save reminder"}</button></div></form></div>}
      <div className="card"><h3>Messages and reminders</h3>{loading ? <p className="sub">Loading records…</p> : rows.length === 0 ? <p className="sub">No messages or reminders are visible to this account yet.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Type</th><th>Subject / title</th><th>Audience</th><th>Status</th><th>Date</th></tr></thead><tbody>{rows.map(r=><tr key={String(r.record_type)+String(r.id)}><td>{String(r.record_type)}</td><td>{String(r.subject ?? r.title ?? "—")}</td><td>{String(r.audience_type ?? r.target_audience ?? "—")}</td><td>{String(r.status ?? "—")}</td><td>{String(r.scheduled_at ?? r.created_at ?? "—")}</td></tr>)}</tbody></table></div>}</div>
    </>}
    {module === "children" && <>
      <div className="notice" style={{marginBottom:18}}>Only children linked to this parent account are shown. Exam results appear here only after the Principal approves them.</div>
      {loading ? <div className="card"><p className="sub">Loading your children's records…</p></div> : rows.length === 0 ? <div className="card"><h3>No linked children yet</h3><p className="sub">Ask your school's Principal to link your parent account to your child's student record.</p></div> : rows.map(child => {
        const childId = String(child.id);
        const childName = [child.first_name, child.middle_name, child.last_name].filter(Boolean).join(" ");
        const classInfo = child.classes as {name?:string;academic_year?:string}|null;
        const attendance = childAttendance.filter(r => String(r.student_id) === childId).slice(0,8);
        const results = childResults.filter(r => String(r.student_id) === childId);
        const fees = childFees.filter(r => String(r.student_id) === childId);
        return <section className="card" key={childId} style={{marginBottom:18}}>
          <div className="welcome" style={{marginBottom:12}}><div><div className="eyebrow">STUDENT NUMBER {String(child.student_number)}</div><h2>{childName}</h2><p className="sub">Class: {String(classInfo?.name ?? "Not assigned")} · Academic year: {String(classInfo?.academic_year ?? "—")} · Status: {String(child.status ?? "active")}</p></div></div>
          <div className="cards" style={{marginTop:8}}><div className="card"><div className="stat-top">Attendance records</div><div className="stat-value">{attendance.length}</div><div className="stat-note">Recent records shown below</div></div><div className="card"><div className="stat-top">Published results</div><div className="stat-value">{results.length}</div><div className="stat-note">Approved by the Principal</div></div><div className="card"><div className="stat-top">Fee records</div><div className="stat-value">{fees.length}</div><div className="stat-note">Fees and balances</div></div></div>
          <h3>Recent attendance</h3>{attendance.length === 0 ? <p className="sub">No attendance records available.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Date</th><th>Status</th><th>Note</th></tr></thead><tbody>{attendance.map(r=><tr key={String(r.id)}><td>{String(r.attendance_date)}</td><td>{String(r.status)}</td><td>{String(r.note??"—")}</td></tr>)}</tbody></table></div>}
          <h3 style={{marginTop:22}}>Approved results</h3>{results.length === 0 ? <p className="sub">No approved results available yet.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Subject</th><th>Term</th><th>Academic year</th><th>Score</th><th>Remarks</th></tr></thead><tbody>{results.map(r=><tr key={String(r.id)}><td>{String(r.subject)}</td><td>{String(r.term)}</td><td>{String(r.academic_year)}</td><td>{String(r.score)}</td><td>{String(r.remarks??"—")}</td></tr>)}</tbody></table></div>}
          <h3 style={{marginTop:22}}>Fees and payments</h3>{fees.length === 0 ? <p className="sub">No fee records available.</p> : <div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Description</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due date</th><th>Status</th></tr></thead><tbody>{fees.map(r=>{const amount=Number(r.amount??0);const paid=Number(r.amount_paid??0);return <tr key={String(r.id)}><td>{String(r.description)}</td><td>{amount.toLocaleString()}</td><td>{paid.toLocaleString()}</td><td>{Math.max(0,amount-paid).toLocaleString()}</td><td>{String(r.due_date??"—")}</td><td>{String(r.status??"—")}</td></tr>})}</tbody></table></div>}
        </section>;
      })}
    </>}
    {!['students','classes','attendance','results','fees','messages','teachers','parents','children'].includes(module) && <div className="card"><h3>{titles[module] ?? module}</h3><p className="sub">This screen is connected to the live table for read-only inspection. Full forms, workflows, and acceptance tests for this module are still being implemented.</p>{loading ? <p className="sub">Loading records…</p> : rows.length === 0 ? <p className="sub">No records are visible to this account, or this module needs its dedicated workflow.</p> : <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:12}}>{JSON.stringify(rows.slice(0,10),null,2)}</pre>}</div>}
  </div>;
}
