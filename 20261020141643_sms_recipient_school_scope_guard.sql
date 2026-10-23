-- Prevent staff from assigning a message/event to accounts from another school.
drop policy if exists school_message_recipients_insert on public.school_message_recipients;
create policy school_message_recipients_insert on public.school_message_recipients for insert to authenticated with check (
 school_id=public.current_school_id() and exists(select 1 from public.school_messages m where m.id=school_message_recipients.message_id and m.school_id=school_message_recipients.school_id and (m.sender_profile_id=(select auth.uid()) or public.current_user_role()='principal'))
 and exists(select 1 from public.profiles p where p.id=school_message_recipients.recipient_profile_id and p.school_id=school_message_recipients.school_id and p.role in ('teacher','parent') and p.is_active=true)
);
drop policy if exists school_event_recipients_insert on public.school_event_recipients;
create policy school_event_recipients_insert on public.school_event_recipients for insert to authenticated with check (
 school_id=public.current_school_id() and public.current_user_role()='principal' and exists(select 1 from public.school_events e where e.id=school_event_recipients.event_id and e.school_id=school_event_recipients.school_id and e.created_by=(select auth.uid()))
 and exists(select 1 from public.profiles p where p.id=school_event_recipients.recipient_profile_id and p.school_id=school_event_recipients.school_id and p.role='parent' and p.is_active=true)
);
