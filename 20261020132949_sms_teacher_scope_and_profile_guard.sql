-- Applied to the live SMS Supabase project on 2026-10-20.
-- Restricts teacher data access to their assigned class and prevents non-Super-Admins
-- from changing role or school assignments on existing profiles.

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND public.current_user_role() IS DISTINCT FROM 'super_admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.school_id IS DISTINCT FROM OLD.school_id THEN
      RAISE EXCEPTION 'Only a Super Admin can change a profile role or school assignment';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS classes_select ON public.classes;
CREATE POLICY classes_select ON public.classes FOR SELECT TO authenticated
USING (
  public.current_user_role() = 'super_admin'
  OR (school_id = public.current_school_id() AND (
    public.current_user_role() IN ('principal', 'parent')
    OR (public.current_user_role() = 'teacher' AND class_teacher_id = (SELECT auth.uid()))
  ))
);

DROP POLICY IF EXISTS students_select ON public.students;
CREATE POLICY students_select ON public.students FOR SELECT TO authenticated
USING (
  public.current_user_role() = 'super_admin'
  OR (school_id = public.current_school_id() AND public.current_user_role() = 'principal')
  OR (school_id = public.current_school_id() AND public.current_user_role() = 'teacher' AND EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = students.class_id
      AND c.school_id = students.school_id AND c.class_teacher_id = (SELECT auth.uid())
  ))
  OR EXISTS (
    SELECT 1 FROM public.parent_students ps
    JOIN public.parents pa ON pa.id = ps.parent_id AND pa.school_id = ps.school_id
    WHERE ps.student_id = students.id AND ps.school_id = students.school_id
      AND pa.profile_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS attendance_select ON public.attendance;
CREATE POLICY attendance_select ON public.attendance FOR SELECT TO authenticated
USING (
  public.current_user_role() = 'super_admin'
  OR (school_id = public.current_school_id() AND public.current_user_role() = 'principal')
  OR (school_id = public.current_school_id() AND public.current_user_role() = 'teacher' AND EXISTS (
    SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id AND c.school_id = s.school_id
    WHERE s.id = attendance.student_id AND s.school_id = attendance.school_id
      AND c.class_teacher_id = (SELECT auth.uid())
  ))
  OR EXISTS (
    SELECT 1 FROM public.parent_students ps
    JOIN public.parents pa ON pa.id = ps.parent_id AND pa.school_id = ps.school_id
    WHERE ps.student_id = attendance.student_id AND ps.school_id = attendance.school_id
      AND pa.profile_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS attendance_insert ON public.attendance;
CREATE POLICY attendance_insert ON public.attendance FOR INSERT TO authenticated WITH CHECK (
  public.current_user_role() = 'super_admin'
  OR (school_id = public.current_school_id() AND recorded_by = (SELECT auth.uid()) AND (
    public.current_user_role() = 'principal'
    OR (public.current_user_role() = 'teacher' AND EXISTS (
      SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id AND c.school_id = s.school_id
      WHERE s.id = attendance.student_id AND s.school_id = attendance.school_id
        AND c.class_teacher_id = (SELECT auth.uid())
    ))
  ))
);

DROP POLICY IF EXISTS attendance_update ON public.attendance;
CREATE POLICY attendance_update ON public.attendance FOR UPDATE TO authenticated
USING (
  public.current_user_role() = 'super_admin'
  OR (school_id = public.current_school_id() AND (
    public.current_user_role() = 'principal'
    OR (public.current_user_role() = 'teacher' AND recorded_by = (SELECT auth.uid()) AND EXISTS (
      SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id AND c.school_id = s.school_id
      WHERE s.id = attendance.student_id AND s.school_id = attendance.school_id
        AND c.class_teacher_id = (SELECT auth.uid())
    ))
  ))
)
WITH CHECK (
  public.current_user_role() = 'super_admin'
  OR (school_id = public.current_school_id() AND (
    public.current_user_role() = 'principal'
    OR (public.current_user_role() = 'teacher' AND recorded_by = (SELECT auth.uid()) AND EXISTS (
      SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id AND c.school_id = s.school_id
      WHERE s.id = attendance.student_id AND s.school_id = attendance.school_id
        AND c.class_teacher_id = (SELECT auth.uid())
    ))
  ))
);

DROP POLICY IF EXISTS results_select ON public.results;
CREATE POLICY results_select ON public.results FOR SELECT TO authenticated
USING (
  public.current_user_role() = 'super_admin'
  OR (school_id = public.current_school_id() AND public.current_user_role() = 'principal')
  OR (school_id = public.current_school_id() AND public.current_user_role() = 'teacher' AND EXISTS (
    SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id AND c.school_id = s.school_id
    WHERE s.id = results.student_id AND s.school_id = results.school_id
      AND c.class_teacher_id = (SELECT auth.uid())
  ))
  OR EXISTS (
    SELECT 1 FROM public.parent_students ps
    JOIN public.parents pa ON pa.id = ps.parent_id AND pa.school_id = ps.school_id
    WHERE ps.student_id = results.student_id AND ps.school_id = results.school_id
      AND pa.profile_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS results_insert ON public.results;
CREATE POLICY results_insert ON public.results FOR INSERT TO authenticated WITH CHECK (
  public.current_user_role() = 'super_admin'
  OR (school_id = public.current_school_id() AND (
    public.current_user_role() = 'principal'
    OR (public.current_user_role() = 'teacher' AND entered_by = (SELECT auth.uid()) AND EXISTS (
      SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id AND c.school_id = s.school_id
      WHERE s.id = results.student_id AND s.school_id = results.school_id
        AND c.class_teacher_id = (SELECT auth.uid())
    ))
  ))
);

DROP POLICY IF EXISTS results_update ON public.results;
CREATE POLICY results_update ON public.results FOR UPDATE TO authenticated
USING (
  public.current_user_role() = 'super_admin'
  OR (school_id = public.current_school_id() AND (
    public.current_user_role() = 'principal'
    OR (public.current_user_role() = 'teacher' AND entered_by = (SELECT auth.uid()) AND EXISTS (
      SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id AND c.school_id = s.school_id
      WHERE s.id = results.student_id AND s.school_id = results.school_id
        AND c.class_teacher_id = (SELECT auth.uid())
    ))
  ))
)
WITH CHECK (
  public.current_user_role() = 'super_admin'
  OR (school_id = public.current_school_id() AND (
    public.current_user_role() = 'principal'
    OR (public.current_user_role() = 'teacher' AND entered_by = (SELECT auth.uid()) AND EXISTS (
      SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id AND c.school_id = s.school_id
      WHERE s.id = results.student_id AND s.school_id = results.school_id
        AND c.class_teacher_id = (SELECT auth.uid())
    ))
  ))
);
