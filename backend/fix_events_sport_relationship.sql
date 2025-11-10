DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'sport_id'
  ) THEN
    ALTER TABLE public.events ADD COLUMN sport_id uuid;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'events' 
      AND column_name = 'sport'
    ) THEN
      UPDATE public.events e
      SET sport_id = s.id
      FROM public.sports s
        WHERE e.sport = s.name;
      
      ALTER TABLE public.events DROP COLUMN sport;
    END IF;
  END IF;
END $$;

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
    AND (
      constraint_name LIKE '%sport%' 
      OR constraint_name LIKE '%sport_id%'
    )
  ) LOOP
    EXECUTE 'ALTER TABLE public.events DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'events' 
    AND constraint_name = 'events_sport_id_fkey'
  ) THEN
    ALTER TABLE public.events 
    ADD CONSTRAINT events_sport_id_fkey 
    FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_sport_id ON public.events(sport_id);

DO $$
BEGIN
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
END $$;

SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'events'
  AND kcu.column_name = 'sport_id';

