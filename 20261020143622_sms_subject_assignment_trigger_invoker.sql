create or replace function public.validate_class_subject_assignment()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.classes c where c.id = new.class_id and c.school_id = new.school_id) then raise exception 'Class must belong to the same school.'; end if;
  if not exists (select 1 from public.subjects s where s.id = new.subject_id and s.school_id = new.school_id and s.is_active = true) then raise exception 'Subject must be active and belong to the same school.'; end if;
  if new.teacher_profile_id is not null and not exists (select 1 from public.profiles p join public.teachers t on t.profile_id = p.id and t.school_id = p.school_id where p.id = new.teacher_profile_id and p.school_id = new.school_id and p.role = 'teacher' and p.is_active = true and t.employment_status = 'active') then raise exception 'Assigned teacher must be active and belong to the same school.'; end if;
  return new;
end; $$;
