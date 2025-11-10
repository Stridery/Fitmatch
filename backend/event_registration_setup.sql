ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_regs" ON public.event_registrations;
DROP POLICY IF EXISTS "read_event_regs_for_host" ON public.event_registrations;
DROP POLICY IF EXISTS "insert_own_regs" ON public.event_registrations;
DROP POLICY IF EXISTS "upsert_own_regs" ON public.event_registrations;
DROP POLICY IF EXISTS "update_own_regs" ON public.event_registrations;
DROP POLICY IF EXISTS "delete_own_regs" ON public.event_registrations;

CREATE POLICY "read_own_regs"
ON public.event_registrations
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "read_event_regs_for_host"
ON public.event_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_registrations.event_id
    AND events.host_id = auth.uid()
  )
);

CREATE POLICY "insert_own_regs"
ON public.event_registrations
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_regs"
ON public.event_registrations
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_regs"
ON public.event_registrations
FOR DELETE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "events_select_public" ON public.events;
DROP POLICY IF EXISTS "events_select_own" ON public.events;
DROP POLICY IF EXISTS "events_insert_own" ON public.events;
DROP POLICY IF EXISTS "events_update_own" ON public.events;
DROP POLICY IF EXISTS "events_delete_own" ON public.events;

CREATE POLICY "events_select_public"
ON public.events
FOR SELECT
USING (is_listed = true);

CREATE POLICY "events_select_own"
ON public.events
FOR SELECT
USING (host_id = auth.uid());

CREATE POLICY "events_insert_own"
ON public.events
FOR INSERT
WITH CHECK (host_id = auth.uid());

CREATE POLICY "events_update_own"
ON public.events
FOR UPDATE
USING (host_id = auth.uid())
WITH CHECK (host_id = auth.uid());

CREATE POLICY "events_delete_own"
ON public.events
FOR DELETE
USING (host_id = auth.uid());

DROP POLICY IF EXISTS "event_groups_select_public" ON public.event_groups;
DROP POLICY IF EXISTS "event_groups_select_own" ON public.event_groups;
DROP POLICY IF EXISTS "event_groups_insert_own" ON public.event_groups;
DROP POLICY IF EXISTS "event_groups_update_own" ON public.event_groups;
DROP POLICY IF EXISTS "event_groups_delete_own" ON public.event_groups;

CREATE POLICY "event_groups_select_public"
ON public.event_groups
FOR SELECT
USING (true);

CREATE POLICY "event_groups_select_own"
ON public.event_groups
FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "event_groups_insert_own"
ON public.event_groups
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "event_groups_update_own"
ON public.event_groups
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "event_groups_delete_own"
ON public.event_groups
FOR DELETE
USING (created_by = auth.uid());

CREATE OR REPLACE FUNCTION public._event_can_join(e public.events)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    e.is_listed = true
    AND (e.rsvp_deadline IS NULL OR now() < e.rsvp_deadline)
    AND e.start_at > now();
$$;

CREATE OR REPLACE FUNCTION public.join_event(p_event_id uuid)
RETURNS TABLE (
  status text,
  enrolled_count int,
  waitlist_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_e public.events;
  v_enrolled int;
  v_waitlist int;
  v_existing text;
  v_waitlist_pos int;
BEGIN
  SELECT * INTO v_e
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;

  IF NOT public._event_can_join(v_e) THEN
    RAISE EXCEPTION 'EVENT_NOT_OPEN';
  END IF;

  SELECT er.status INTO v_existing
  FROM public.event_registrations er
  WHERE er.event_id = p_event_id AND er.user_id = auth.uid()
  FOR UPDATE;

  SELECT
    COALESCE(SUM(CASE WHEN er.status='ENROLLED' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN er.status='WAITLIST' THEN 1 ELSE 0 END), 0)
  INTO v_enrolled, v_waitlist
  FROM public.event_registrations er
  WHERE er.event_id = p_event_id AND er.status IN ('ENROLLED', 'WAITLIST');

  IF v_existing IS NULL THEN
    IF v_enrolled < v_e.capacity_unit THEN
      INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos)
      VALUES (p_event_id, auth.uid(), 'ENROLLED', NULL);
      v_enrolled := v_enrolled + 1;
      RETURN QUERY SELECT 'ENROLLED'::text, v_enrolled, v_waitlist;
    ELSE
      SELECT COALESCE(MAX(er.waitlist_pos), 0) + 1 INTO v_waitlist_pos
      FROM public.event_registrations er
      WHERE er.event_id = p_event_id AND er.status = 'WAITLIST';
      
      INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos)
      VALUES (p_event_id, auth.uid(), 'WAITLIST', v_waitlist_pos);
      v_waitlist := v_waitlist + 1;
      RETURN QUERY SELECT 'WAITLIST'::text, v_enrolled, v_waitlist;
    END IF;
  ELSIF v_existing = 'CANCELLED' THEN
    IF v_enrolled < v_e.capacity_unit THEN
      UPDATE public.event_registrations
      SET status='ENROLLED', waitlist_pos=NULL, created_at=now()
      WHERE event_id = p_event_id AND user_id = auth.uid();
      v_enrolled := v_enrolled + 1;
      RETURN QUERY SELECT 'ENROLLED'::text, v_enrolled, v_waitlist;
    ELSE
      SELECT COALESCE(MAX(er.waitlist_pos), 0) + 1 INTO v_waitlist_pos
      FROM public.event_registrations er
      WHERE er.event_id = p_event_id AND er.status = 'WAITLIST';
      
      UPDATE public.event_registrations
      SET status='WAITLIST', waitlist_pos=v_waitlist_pos, created_at=now()
      WHERE event_id = p_event_id AND user_id = auth.uid();
      v_waitlist := v_waitlist + 1;
      RETURN QUERY SELECT 'WAITLIST'::text, v_enrolled, v_waitlist;
    END IF;
  ELSE
    RETURN QUERY SELECT v_existing::text, v_enrolled, v_waitlist;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_event(p_event_id uuid)
RETURNS TABLE (
  status text,
  promoted_user uuid,
  enrolled_count int,
  waitlist_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_e public.events;
  v_my_status text;
  v_my_waitlist_pos int;
  v_promote_user uuid;
  v_enrolled int;
  v_waitlist int;
BEGIN
  SELECT * INTO v_e
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;

  SELECT er.status, er.waitlist_pos INTO v_my_status, v_my_waitlist_pos
  FROM public.event_registrations er
  WHERE er.event_id = p_event_id AND er.user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'NONE'::text, NULL::uuid, 0, 0;
  END IF;

  IF v_my_status = 'ENROLLED' THEN
    UPDATE public.event_registrations
    SET status='CANCELLED', waitlist_pos=NULL, created_at=now()
    WHERE event_id = p_event_id AND user_id = auth.uid();

    SELECT er.user_id INTO v_promote_user
    FROM public.event_registrations er
    WHERE er.event_id = p_event_id AND er.status='WAITLIST'
    ORDER BY er.waitlist_pos ASC, er.created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      UPDATE public.event_registrations
      SET status='ENROLLED', waitlist_pos=NULL, created_at=now()
      WHERE event_id = p_event_id AND user_id = v_promote_user;

      UPDATE public.event_registrations
      SET waitlist_pos = waitlist_pos - 1
      WHERE event_id = p_event_id 
      AND status = 'WAITLIST'
      AND waitlist_pos > 1;
    END IF;
  ELSIF v_my_status = 'WAITLIST' THEN
    UPDATE public.event_registrations
    SET status='CANCELLED', waitlist_pos=NULL, created_at=now()
    WHERE event_id = p_event_id AND user_id = auth.uid();

    UPDATE public.event_registrations
    SET waitlist_pos = waitlist_pos - 1
    WHERE event_id = p_event_id 
    AND status = 'WAITLIST'
    AND waitlist_pos > v_my_waitlist_pos;
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN er.status='ENROLLED' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN er.status='WAITLIST' THEN 1 ELSE 0 END), 0)
  INTO v_enrolled, v_waitlist
  FROM public.event_registrations er
  WHERE er.event_id = p_event_id AND er.status IN ('ENROLLED', 'WAITLIST');

  RETURN QUERY SELECT
    'CANCELLED'::text,
    v_promote_user,
    v_enrolled,
    v_waitlist;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._event_can_join(public.events) TO authenticated;

GRANT SELECT ON public.events TO authenticated;
GRANT SELECT ON public.event_registrations TO authenticated;
GRANT SELECT ON public.event_groups TO authenticated;
GRANT SELECT ON public.user_profile TO authenticated;
GRANT SELECT ON public.sports TO authenticated;

