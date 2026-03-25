-- Fix Chelsea badge URL corrupted by TheSportsDB lookupteam.php free-tier bug
-- The lookup endpoint returns Arsenal data regardless of ID on the free tier
-- Restore the correct badge from TheSportsDB search endpoint
UPDATE public.clubs
SET badge_url = 'https://r2.thesportsdb.com/images/media/team/badge/yvwvtu1448813215.png'
WHERE external_id = '133610'
  AND (
    badge_url IS NULL
    OR badge_url = 'https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png'
  );
