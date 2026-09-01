-- ============================================================
-- Chronos: Manual one-shot cleanup of broken biometric enrollment data
-- Created: 2026-08-31
--
-- WARNING: This script DELETES rows and Storage objects. Run it only
-- in the Supabase Dashboard SQL editor as `postgres` / service role,
-- and review the audit SELECTs below the first time it runs.
--
-- What it removes:
--   1. biometric_templates rows whose template_hash is the legacy
--      zero-padded 32-bit "hash" (56 leading zeros + 8 hex chars),
--      produced by the buggy Java-style hash in commit ad35f38.
--   2. `.xyt` objects in the `biometrics` bucket stored under the nil
--      workspace path `00000000-0000-0000-0000-000000000000/` with
--      content <= 64 bytes (truncated/stub 'templates' only, conservatively).
--   3. Resets members.biometrics_enrolled so affected members can
--      re-enroll cleanly (their real legacy templates remain in
--      %LOCALAPPDATA%\Chronos\data\minut for reference).
-- ============================================================

BEGIN;

-- ------------------------------------------------------------------
-- 0. AUDIT - review BEFORE running the deletes below
-- ------------------------------------------------------------------
SELECT 'bad_template_rows' AS audit, count(*), json_agg(member_id) AS members
  FROM public.biometric_templates
WHERE template_hash LIKE '0000%';

SELECT 'broken_storage_objects' AS audit, count(*) AS objects, json_agg(name) AS names
  FROM storage.objects
WHERE bucket_id = 'biometrics'
  AND name LIKE '00000000-0000-0000-0000-000000000000/%'
  AND CAST(metadata->>'size' AS integer) <= 64;

-- ------------------------------------------------------------------
-- 1. Snapshot affected member ids, then delete the fake-hash rows
-- ------------------------------------------------------------------
CREATE TEMP TABLE _garbage_members AS
  SELECT DISTINCT member_id
  FROM public.biometric_templates
  WHERE template_hash LIKE '0000%';

DELETE FROM public.biometric_templates
  WHERE template_hash LIKE '0000%';

-- ------------------------------------------------------------------
-- 2. Delete the broken 64-byte .xyt objects under the nil workspace path
-- ------------------------------------------------------------------
DELETE FROM storage.objects
  WHERE bucket_id = 'biometrics'
    AND name LIKE '00000000-0000-0000-0000-000000000000/%'
    AND CAST(metadata->>'size' AS integer) <= 64;

-- ------------------------------------------------------------------
-- 3. Reset enrollment flags so these members can re-enroll
--    (guarded: only runs if a public.members table with a
--    biometrics_enrolled column actually exists)
-- ------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.tables t
      JOIN information_schema.columns c
        ON c.table_schema = t.table_schema
       AND c.table_name = t.table_name
     WHERE t.table_schema = 'public'
       AND t.table_name = 'members'
       AND c.column_name = 'biometrics_enrolled'
  ) THEN
    UPDATE public.members m
       SET biometrics_enrolled = false,
           biometrics_enrolled_at = NULL
    WHERE m.id IN (SELECT member_id FROM _garbage_members);
  END IF;
END $$;

DROP TABLE _garbage_members;

COMMIT;

-- ------------------------------------------------------------------
-- POST-run verification
-- ------------------------------------------------------------------
SELECT count(*) AS remaining_fake_hash_rows FROM public.biometric_templates WHERE template_hash LIKE '0000%';
SELECT count(*) AS remaining_nil_path_objects FROM storage.objects
  WHERE bucket_id='biometrics' AND name LIKE '00000000-0000-0000-0000-000000000000/%';