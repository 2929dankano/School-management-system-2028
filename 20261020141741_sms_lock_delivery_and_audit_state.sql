-- Delivery status and audit writes remain server-controlled until a trusted dispatcher/audit writer exists.
drop policy if exists audit_logs_insert on public.audit_logs;
revoke insert,update,delete on public.audit_logs from authenticated;
drop policy if exists school_message_recipients_update on public.school_message_recipients;
revoke update on public.school_message_recipients from authenticated;
drop policy if exists school_event_recipients_update on public.school_event_recipients;
revoke update on public.school_event_recipients from authenticated;
drop policy if exists school_messages_insert on public.school_messages;
create policy school_messages_insert on public.school_messages for insert to authenticated with check (school_id=public.current_school_id() and sender_profile_id=(select auth.uid()) and public.current_user_role() in ('principal','teacher') and status='draft' and sent_at is null);
drop policy if exists school_events_insert on public.school_events;
create policy school_events_insert on public.school_events for insert to authenticated with check (school_id=public.current_school_id() and created_by=(select auth.uid()) and public.current_user_role()='principal' and status in ('draft','scheduled'));
drop policy if exists school_events_update on public.school_events;
create policy school_events_update on public.school_events for update to authenticated using (school_id=public.current_school_id() and public.current_user_role()='principal') with check (school_id=public.current_school_id() and public.current_user_role()='principal' and status in ('draft','scheduled','cancelled'));
