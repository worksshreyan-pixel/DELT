-- ------------------------------------------------------------------------------
-- 22. Add username column to profiles table & update auto user creation trigger
-- ------------------------------------------------------------------------------

-- 1. Add username column if it doesn't already exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Safe deterministic backfill for existing profiles
DO $$
DECLARE
  r RECORD;
  base_u TEXT;
  final_u TEXT;
  cnt INT;
BEGIN
  FOR r IN SELECT id, email FROM public.profiles WHERE username IS NULL OR trim(username) = '' LOOP
    -- Normalize username candidate from email prefix
    base_u := lower(regexp_replace(split_part(r.email, '@', 1), '[^a-zA-Z0-9_-]', '', 'g'));
    
    -- Ensure minimum length of 3
    IF length(base_u) < 3 THEN
      base_u := 'user_' || lower(substring(r.id::text from 1 for 8));
    END IF;
    
    -- Enforce max length limit of 30
    IF length(base_u) > 30 THEN
      base_u := substring(base_u from 1 for 30);
    END IF;
    
    final_u := base_u;
    cnt := 0;
    
    -- Ensure uniqueness among profiles
    LOOP
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = final_u AND id <> r.id);
      cnt := cnt + 1;
      final_u := substring(base_u from 1 for 25) || cnt::text;
    END LOOP;
    
    UPDATE public.profiles SET username = final_u WHERE id = r.id;
  END LOOP;
END $$;

-- 3. Create unique index for username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- 4. Update public.handle_new_user() to populate unique username on new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  base_username := lower(regexp_replace(
    COALESCE(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    '[^a-zA-Z0-9_-]', '', 'g'
  ));

  IF length(base_username) < 3 THEN
    base_username := 'user_' || lower(substring(new.id::text from 1 for 8));
  END IF;

  IF length(base_username) > 30 THEN
    base_username := substring(base_username from 1 for 30);
  END IF;

  final_username := base_username;

  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username);
    counter := counter + 1;
    final_username := substring(base_username from 1 for 25) || counter::text;
  END LOOP;

  INSERT INTO public.profiles (id, email, display_name, username, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'displayName', split_part(new.email, '@', 1)),
    final_username,
    now(),
    now()
  );

  INSERT INTO public.storage_usage (user_id, total_bytes, limit_bytes, updated_at)
  VALUES (new.id, 0, 1073741824, now())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.deal_credits (user_id, plan_id, total, used, remaining, updated_at)
  VALUES (new.id, 'free', 1, 0, 1, now())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
