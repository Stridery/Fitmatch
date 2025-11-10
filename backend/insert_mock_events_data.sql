DO $$
DECLARE
  v_basketball_id uuid;
  v_soccer_id uuid;
  v_tennis_id uuid;
  v_swimming_id uuid;
  v_volleyball_id uuid;
  
  v_host_1 uuid;
  v_host_2 uuid;
  v_host_3 uuid;
  v_host_4 uuid;
  v_host_5 uuid;
  v_host_6 uuid;
  v_host_7 uuid;
  
  v_user_count int;
  
  v_event_1_id uuid;
  v_event_2_id uuid;
  v_event_3_id uuid;
  v_event_4_id uuid;
  v_event_5_id uuid;
  v_event_6_id uuid;
  v_event_7_id uuid;
  
  v_group_1_id uuid;
  v_series_1_id uuid;
  
  v_group_creator uuid;
  v_series_creator uuid;
BEGIN
  SELECT id INTO v_basketball_id FROM public.sports WHERE name = 'Basketball' LIMIT 1;
  SELECT id INTO v_soccer_id FROM public.sports WHERE name = 'Soccer' LIMIT 1;
  SELECT id INTO v_tennis_id FROM public.sports WHERE name = 'Tennis' LIMIT 1;
  SELECT id INTO v_swimming_id FROM public.sports WHERE name = 'Swimming' LIMIT 1;
  SELECT id INTO v_volleyball_id FROM public.sports WHERE name = 'Volleyball' LIMIT 1;
  
  IF v_basketball_id IS NULL THEN
    INSERT INTO public.sports (id, name) VALUES (gen_random_uuid(), 'Basketball') RETURNING id INTO v_basketball_id;
  END IF;
  IF v_soccer_id IS NULL THEN
    INSERT INTO public.sports (id, name) VALUES (gen_random_uuid(), 'Soccer') RETURNING id INTO v_soccer_id;
  END IF;
  IF v_tennis_id IS NULL THEN
    INSERT INTO public.sports (id, name) VALUES (gen_random_uuid(), 'Tennis') RETURNING id INTO v_tennis_id;
  END IF;
  IF v_swimming_id IS NULL THEN
    INSERT INTO public.sports (id, name) VALUES (gen_random_uuid(), 'Swimming') RETURNING id INTO v_swimming_id;
  END IF;
  IF v_volleyball_id IS NULL THEN
    INSERT INTO public.sports (id, name) VALUES (gen_random_uuid(), 'Volleyball') RETURNING id INTO v_volleyball_id;
  END IF;
  
  SELECT COUNT(*) INTO v_user_count FROM public.user_profile;
  
  IF v_user_count = 0 THEN
    RAISE EXCEPTION 'No users found in user_profile table. Please create users first.';
  END IF;
  
  SELECT user_id INTO v_host_1 FROM public.user_profile ORDER BY random() LIMIT 1;
  SELECT user_id INTO v_host_2 FROM public.user_profile ORDER BY random() LIMIT 1;
  SELECT user_id INTO v_host_3 FROM public.user_profile ORDER BY random() LIMIT 1;
  SELECT user_id INTO v_host_4 FROM public.user_profile ORDER BY random() LIMIT 1;
  SELECT user_id INTO v_host_5 FROM public.user_profile ORDER BY random() LIMIT 1;
  SELECT user_id INTO v_host_6 FROM public.user_profile ORDER BY random() LIMIT 1;
  SELECT user_id INTO v_host_7 FROM public.user_profile ORDER BY random() LIMIT 1;
  
  SELECT user_id INTO v_group_creator FROM public.user_profile ORDER BY random() LIMIT 1;
  SELECT user_id INTO v_series_creator FROM public.user_profile ORDER BY random() LIMIT 1;
  
  INSERT INTO public.event_groups (
    id, title, group_type, created_by, sport_id, created_at
  ) VALUES (
    gen_random_uuid(),
    'Championship Tournament',
    'COMPETITION',
    v_group_creator,
    v_basketball_id,
    (now() - interval '15 days')::timestamptz
  ) RETURNING id INTO v_group_1_id;
  
  INSERT INTO public.event_groups (
    id, title, group_type, created_by, sport_id, created_at
  ) VALUES (
    gen_random_uuid(),
    'Swimming Training Series',
    'SERIES',
    v_series_creator,
    v_swimming_id,
    (now() - interval '7 days')::timestamptz
  ) RETURNING id INTO v_series_1_id;
  
  INSERT INTO public.events (
    id, host_id, title, sport_id, start_at, end_at, location_text,
    capacity_unit, group_id, group_type, is_listed, join_policy,
    rsvp_deadline, round, score_home, score_away, created_at
  ) VALUES (
    gen_random_uuid(),
    v_host_1,
    'Basketball Pickup Game',
    v_basketball_id,
    (now() + interval '1 day' + interval '18 hours')::timestamptz,
    (now() + interval '1 day' + interval '20 hours')::timestamptz,
    'Central Park Basketball Court',
    20,
    NULL,
    'SINGLE',
    true,
    'PUBLIC_OPEN',
    (now() + interval '1 day' + interval '12 hours')::timestamptz,
    NULL,
    NULL,
    NULL,
    (now() - interval '5 days')::timestamptz
  ) RETURNING id INTO v_event_1_id;

  INSERT INTO public.events (
    id, host_id, title, sport_id, start_at, end_at, location_text,
    capacity_unit, group_id, group_type, is_listed, join_policy,
    rsvp_deadline, round, score_home, score_away, created_at
  ) VALUES (
    gen_random_uuid(),
    v_host_2,
    'Soccer Training Session',
    v_soccer_id,
    (now() + interval '1 day' + interval '10 hours')::timestamptz,
    (now() + interval '1 day' + interval '12 hours')::timestamptz,
    'Riverside Soccer Field',
    15,
    NULL,
    'SINGLE',
    true,
    'PUBLIC_OPEN',
    (now() + interval '1 day' + interval '8 hours')::timestamptz,
    NULL,
    NULL,
    NULL,
    (now() - interval '3 days')::timestamptz
  ) RETURNING id INTO v_event_2_id;

  INSERT INTO public.events (
    id, host_id, title, sport_id, start_at, end_at, location_text,
    capacity_unit, group_id, group_type, is_listed, join_policy,
    rsvp_deadline, round, score_home, score_away, created_at
  ) VALUES (
    gen_random_uuid(),
    v_host_3,
    'Tennis Doubles Tournament',
    v_tennis_id,
    (now() + interval '7 days' + interval '14 hours')::timestamptz,
    (now() + interval '7 days' + interval '17 hours')::timestamptz,
    'Tennis Club Courts',
    8,
    NULL,
    'SINGLE',
    true,
    'PUBLIC_CLOSED',
    (now() + interval '5 days')::timestamptz,
    NULL,
    NULL,
    NULL,
    (now() - interval '10 days')::timestamptz
  ) RETURNING id INTO v_event_3_id;

  INSERT INTO public.events (
    id, host_id, title, sport_id, start_at, end_at, location_text,
    capacity_unit, group_id, group_type, is_listed, join_policy,
    rsvp_deadline, round, score_home, score_away, created_at
  ) VALUES (
    gen_random_uuid(),
    v_host_4,
    'Championship Final: Team A vs Team B',
    v_basketball_id,
    (now() + interval '7 days' + interval '19 hours')::timestamptz,
    (now() + interval '7 days' + interval '21 hours')::timestamptz,
    'Main Arena',
    100,
    v_group_1_id,
    'COMPETITION',
    true,
    'ROSTER_LOCKED',
    NULL,
    1,
    NULL,
    NULL,
    (now() - interval '15 days')::timestamptz
  ) RETURNING id INTO v_event_4_id;

  INSERT INTO public.events (
    id, host_id, title, sport_id, start_at, end_at, location_text,
    capacity_unit, group_id, group_type, is_listed, join_policy,
    rsvp_deadline, round, score_home, score_away, created_at
  ) VALUES (
    gen_random_uuid(),
    v_host_5,
    'Swimming Training Series - Week 1',
    v_swimming_id,
    (now() + interval '2 days' + interval '16 hours')::timestamptz,
    (now() + interval '2 days' + interval '18 hours')::timestamptz,
    'Olympic Pool',
    12,
    v_series_1_id,
    'SERIES',
    true,
    'PUBLIC_OPEN',
    (now() + interval '2 days' + interval '10 hours')::timestamptz,
    1,
    NULL,
    NULL,
    (now() - interval '7 days')::timestamptz
  ) RETURNING id INTO v_event_5_id;

  INSERT INTO public.events (
    id, host_id, title, sport_id, start_at, end_at, location_text,
    capacity_unit, group_id, group_type, is_listed, join_policy,
    rsvp_deadline, round, score_home, score_away, created_at
  ) VALUES (
    gen_random_uuid(),
    v_host_5,
    'Swimming Training Series - Week 2',
    v_swimming_id,
    (now() + interval '9 days' + interval '16 hours')::timestamptz,
    (now() + interval '9 days' + interval '18 hours')::timestamptz,
    'Olympic Pool',
    12,
    v_series_1_id,
    'SERIES',
    true,
    'PUBLIC_OPEN',
    (now() + interval '9 days' + interval '10 hours')::timestamptz,
    2,
    NULL,
    NULL,
    (now() - interval '7 days')::timestamptz
  ) RETURNING id INTO v_event_6_id;

  INSERT INTO public.events (
    id, host_id, title, sport_id, start_at, end_at, location_text,
    capacity_unit, group_id, group_type, is_listed, join_policy,
    rsvp_deadline, round, score_home, score_away, created_at
  ) VALUES (
    gen_random_uuid(),
    v_host_6,
    'Volleyball Open Play',
    v_volleyball_id,
    (now() + interval '1 day' + interval '15 hours')::timestamptz,
    (now() + interval '1 day' + interval '17 hours')::timestamptz,
    'Beach Volleyball Court',
    12,
    NULL,
    'SINGLE',
    true,
    'PUBLIC_OPEN',
    (now() - interval '2 hours')::timestamptz, -- Expired
    NULL,
    NULL,
    NULL,
    (now() - interval '2 days')::timestamptz
  ) RETURNING id INTO v_event_7_id;

  INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos, created_at)
  SELECT 
    v_event_1_id,
    user_id,
    'ENROLLED',
    NULL,
    (now() - interval '4 days' + (random() * interval '3 days'))::timestamptz
  FROM (
    SELECT user_id 
    FROM public.user_profile 
    ORDER BY random() 
    LIMIT 12
  ) users
  ON CONFLICT (event_id, user_id) DO NOTHING;
  
  INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos, created_at)
  SELECT 
    v_event_1_id,
    user_id,
    'WAITLIST',
    row_number() OVER (),
    (now() - interval '1 day' + (random() * interval '1 day'))::timestamptz
  FROM (
    SELECT user_id 
    FROM public.user_profile 
    WHERE user_id NOT IN (SELECT user_id FROM public.event_registrations WHERE event_id = v_event_1_id)
    ORDER BY random() 
    LIMIT 3
  ) users
  ON CONFLICT (event_id, user_id) DO NOTHING;

  INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos, created_at)
  SELECT 
    v_event_2_id,
    user_id,
    'ENROLLED',
    NULL,
    (now() - interval '3 days' + (random() * interval '3 days'))::timestamptz
  FROM (
    SELECT user_id 
    FROM public.user_profile 
    ORDER BY random() 
    LIMIT 15
  ) users
  ON CONFLICT (event_id, user_id) DO NOTHING;

  INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos, created_at)
  SELECT 
    v_event_3_id,
    user_id,
    'ENROLLED',
    NULL,
    (now() - interval '10 days' + (random() * interval '4 days'))::timestamptz
  FROM (
    SELECT user_id 
    FROM public.user_profile 
    ORDER BY random() 
    LIMIT 5
  ) users
  ON CONFLICT (event_id, user_id) DO NOTHING;

  INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos, created_at)
  SELECT 
    v_event_4_id,
    user_id,
    'ENROLLED',
    NULL,
    (now() - interval '15 days')::timestamptz
  FROM (
    SELECT user_id 
    FROM public.user_profile 
    ORDER BY random() 
    LIMIT 20
  ) users
  ON CONFLICT (event_id, user_id) DO NOTHING;

  INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos, created_at)
  SELECT 
    v_event_5_id,
    user_id,
    'ENROLLED',
    NULL,
    (now() - interval '7 days' + (random() * interval '3 days'))::timestamptz
  FROM (
    SELECT user_id 
    FROM public.user_profile 
    ORDER BY random() 
    LIMIT 8
  ) users
  ON CONFLICT (event_id, user_id) DO NOTHING;
  
  INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos, created_at)
  SELECT 
    v_event_5_id,
    user_id,
    'WAITLIST',
    row_number() OVER (),
    (now() - interval '3 days' + (random() * interval '2 days'))::timestamptz
  FROM (
    SELECT user_id 
    FROM public.user_profile 
    WHERE user_id NOT IN (SELECT user_id FROM public.event_registrations WHERE event_id = v_event_5_id)
    ORDER BY random() 
    LIMIT 2
  ) users
  ON CONFLICT (event_id, user_id) DO NOTHING;

  INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos, created_at)
  SELECT 
    v_event_6_id,
    user_id,
    'ENROLLED',
    NULL,
    (now() - interval '7 days' + (random() * interval '2 days'))::timestamptz
  FROM (
    SELECT user_id 
    FROM public.user_profile 
    ORDER BY random() 
    LIMIT 6
  ) users
  ON CONFLICT (event_id, user_id) DO NOTHING;

  INSERT INTO public.event_registrations (event_id, user_id, status, waitlist_pos, created_at)
  SELECT 
    v_event_7_id,
    user_id,
    'ENROLLED',
    NULL,
    (now() - interval '2 days' + (random() * interval '1 day'))::timestamptz
  FROM (
    SELECT user_id 
    FROM public.user_profile 
    ORDER BY random() 
    LIMIT 4
  ) users
  ON CONFLICT (event_id, user_id) DO NOTHING;
END $$;
