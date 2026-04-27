-- =====================================================================
-- 0004 — Seed immagini per esercizi popolari (opzionale)
-- Fonti: Wikimedia Commons (CC / pubblico dominio)
-- =====================================================================

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bench-press-1.png/640px-Bench-press-1.png'
  where name = 'Panca piana' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Incline-dumbbell-press-1.png/640px-Incline-dumbbell-press-1.png'
  where name = 'Panca inclinata' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Dumbbell-bench-press-1.png/640px-Dumbbell-bench-press-1.png'
  where name = 'Panca con manubri' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Push-up-1.png/640px-Push-up-1.png'
  where name = 'Push-up' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Dips-1.png/640px-Dips-1.png'
  where name = 'Dip alle parallele' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Deadlift-1.png/640px-Deadlift-1.png'
  where name = 'Stacco da terra' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Pull-up-1.png/640px-Pull-up-1.png'
  where name = 'Trazioni alla sbarra' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Bent-over-row-1.png/640px-Bent-over-row-1.png'
  where name = 'Rematore bilanciere' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Lat-pulldown-1.png/640px-Lat-pulldown-1.png'
  where name = 'Lat machine' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Squat-1.png/640px-Squat-1.png'
  where name = 'Squat' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Front-squat-1.png/640px-Front-squat-1.png'
  where name = 'Front squat' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Leg-press-1.png/640px-Leg-press-1.png'
  where name = 'Leg press' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Lunges-1.png/640px-Lunges-1.png'
  where name = 'Affondi' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Romanian-deadlift-1.png/640px-Romanian-deadlift-1.png'
  where name = 'Stacco rumeno' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Overhead-press-1.png/640px-Overhead-press-1.png'
  where name = 'Military press' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Lateral-raise-1.png/640px-Lateral-raise-1.png'
  where name = 'Alzate laterali' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Barbell-curl-1.png/640px-Barbell-curl-1.png'
  where name = 'Curl bilanciere' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Dumbbell-curl-1.png/640px-Dumbbell-curl-1.png'
  where name = 'Curl manubri' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Triceps-pushdown-1.png/640px-Triceps-pushdown-1.png'
  where name = 'Push down ai cavi' and is_preset = true;

update public.exercises set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Plank-1.png/640px-Plank-1.png'
  where name = 'Plank' and is_preset = true;

-- Nota: alcuni URL potrebbero essere 404 se l'immagine non esiste su
-- Wikimedia con quel nome. In quel caso la miniatura mostrerà il
-- fallback (badge gruppo muscolare). Sostituisci da /coach/exercises.
