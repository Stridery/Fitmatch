CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  sport_id uuid NOT NULL REFERENCES public.sports(id) ON DELETE RESTRICT,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  location_text text NOT NULL,
  capacity_unit integer NOT NULL CHECK (capacity_unit > 0),
  group_id uuid,
  group_type text NOT NULL CHECK (group_type IN ('SINGLE', 'SERIES', 'COMPETITION')),
  is_listed boolean NOT NULL DEFAULT true,
  join_policy text NOT NULL CHECK (join_policy IN ('PUBLIC_OPEN', 'PUBLIC_CLOSED', 'ROSTER_LOCKED')),
  rsvp_deadline timestamptz,
  round integer,
  score_home integer,
  score_away integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'events'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'events' 
      AND column_name = 'sport_id'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'sport'
      ) THEN
        ALTER TABLE public.events ADD COLUMN sport_id uuid;
        
        UPDATE public.events e
        SET sport_id = s.id
        FROM public.sports s
        WHERE e.sport = s.name;
        
        ALTER TABLE public.events DROP COLUMN sport;
      ELSE
        ALTER TABLE public.events ADD COLUMN sport_id uuid;
      END IF;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'events' 
      AND constraint_name = 'events_sport_id_fkey'
    ) THEN
      DO $$
      DECLARE
        r record;
      BEGIN
        FOR r IN (
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE constraint_schema = 'public' 
          AND table_name = 'events' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%sport%'
        ) LOOP
          EXECUTE 'ALTER TABLE public.events DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
        END LOOP;
      END $$;
      
      ALTER TABLE public.events 
      ADD CONSTRAINT events_sport_id_fkey 
      FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE RESTRICT;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'events' 
      AND column_name = 'sport_id'
      AND is_nullable = 'YES'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.events WHERE sport_id IS NULL
      ) THEN
        ALTER TABLE public.events ALTER COLUMN sport_id SET NOT NULL;
      END IF;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('ENROLLED', 'WAITLIST', 'CANCELLED')),
  waitlist_pos integer, -- Position in waitlist (1-based)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON public.events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_is_listed ON public.events(is_listed);
CREATE INDEX IF NOT EXISTS idx_events_sport_id ON public.events(sport_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

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
USING (host_id = auth.uid());

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

CREATE POLICY "upsert_own_regs"
ON public.event_registrations
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_regs"
ON public.event_registrations
FOR UPDATE
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public._event_can_join(e public.events)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.is_listed = true
    AND e.join_policy = 'PUBLIC_OPEN'
    AND (e.rsvp_deadline IS NULL OR now() < e.rsvp_deadline);
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
    COALESCE(SUM(CASE WHEN status='ENROLLED' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status='WAITLIST' THEN 1 ELSE 0 END), 0)
  INTO v_enrolled, v_waitlist
  FROM public.event_registrations
  WHERE event_id = p_event_id AND status IN ('ENROLLED', 'WAITLIST')
  FOR UPDATE;

  IF v_existing IS NULL THEN
    IF v_enrolled < v_e.capacity_unit THEN
      INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos)
      VALUES (p_event_id, auth.uid(), 'ENROLLED', NULL);
      v_enrolled := v_enrolled + 1;
      RETURN QUERY SELECT 'ENROLLED'::text, v_enrolled, v_waitlist;
    ELSE
      INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos)
      VALUES (p_event_id, auth.uid(), 'WAITLIST', v_waitlist + 1);
      v_waitlist := v_waitlist + 1;
      RETURN QUERY SELECT 'WAITLIST'::text, v_enrolled, v_waitlist;
    END IF;
  ELSIF v_existing = 'CANCELLED' THEN
    IF v_enrolled < v_e.capacity_unit THEN
      UPDATE public.event_registrations
      SET status='ENROLLED', waitlist_pos=NULL, created_at=now(), updated_at=now()
      WHERE event_id = p_event_id AND user_id = auth.uid();
      v_enrolled := v_enrolled + 1;
      RETURN QUERY SELECT 'ENROLLED'::text, v_enrolled, v_waitlist;
    ELSE
      UPDATE public.event_registrations
      SET status='WAITLIST', waitlist_pos=v_waitlist + 1, created_at=now(), updated_at=now()
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

  SELECT status INTO v_my_status
  FROM public.event_registrations
  WHERE event_id = p_event_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'NONE'::text, NULL::uuid, 0, 0;
  END IF;

  IF v_my_status = 'ENROLLED' THEN
    UPDATE public.event_registrations
    SET status='CANCELLED', waitlist_pos=NULL, updated_at=now()
    WHERE event_id = p_event_id AND user_id = auth.uid();

    SELECT user_id INTO v_promote_user
    FROM public.event_registrations
    WHERE event_id = p_event_id AND status='WAITLIST'
    ORDER BY waitlist_pos ASC, created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      UPDATE public.event_registrations
      SET status='ENROLLED', waitlist_pos=NULL, updated_at=now()
      WHERE event_id = p_event_id AND user_id = v_promote_user;
    END IF;
  ELSIF v_my_status = 'WAITLIST' THEN
    UPDATE public.event_registrations
    SET status='CANCELLED', waitlist_pos=NULL, updated_at=now()
    WHERE event_id = p_event_id AND user_id = auth.uid();
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN status='ENROLLED' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status='WAITLIST' THEN 1 ELSE 0 END), 0)
  INTO v_enrolled, v_waitlist
  FROM public.event_registrations
  WHERE event_id = p_event_id;

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

CREATE OR REPLACE VIEW public.event_counters AS
SELECT
  event_id,
  COUNT(*) FILTER (WHERE status = 'ENROLLED') AS enrolled_count,
  COUNT(*) FILTER (WHERE status = 'WAITLIST') AS waitlist_count,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled_count
FROM public.event_registrations
GROUP BY event_id;

GRANT SELECT ON public.event_counters TO authenticated;

