-- Demo content for the client presentation: a real session, recipe and
-- mindset entry pointing to videos uploaded in storage.

insert into public.programs (id, title, description, level, duration_weeks)
values (
  '00000000-0000-4000-8000-000000000001',
  'Full body 4 semaines',
  'Programme complet pour renforcer l''ensemble du corps, tonifier les fessiers et travailler le gainage en profondeur.',
  'intermediaire',
  4
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  level = excluded.level,
  duration_weeks = excluded.duration_weeks;

insert into public.sessions (id, program_id, title, description, duration_min, video_url, order_index)
values (
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000001',
  'Full body — focus glutes & core',
  'Un entraînement complet pour renforcer l''ensemble du corps, tonifier les fessiers et travailler le gainage en profondeur.',
  35,
  'https://acjxdiqswpkxxezczken.supabase.co/storage/v1/object/public/session-videos/seed/full-body-glutes.mp4',
  0
)
on conflict (id) do update set
  program_id = excluded.program_id,
  title = excluded.title,
  description = excluded.description,
  duration_min = excluded.duration_min,
  video_url = excluded.video_url,
  order_index = excluded.order_index;

insert into public.recipes (id, title, description, video_url, meal_type, prep_min, kcal, protein_g, carbs_g, fat_g, ingredients)
values (
  '00000000-0000-4000-8000-000000000020',
  'Bowl protéiné saumon',
  'Saumon fumé, riz basmati, avocat, edamame. Riche en protéines pour soutenir ton entraînement.',
  'https://acjxdiqswpkxxezczken.supabase.co/storage/v1/object/public/recipe-media/seed/bowl-proteine.mp4',
  'dejeuner',
  20,
  620,
  42,
  55,
  20,
  E'150 g de saumon fumé\n100 g de riz basmati cuit\n1/2 avocat\n50 g d''edamame\nGraines de sésame\nCitron, sauce soja légère'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  video_url = excluded.video_url,
  meal_type = excluded.meal_type,
  prep_min = excluded.prep_min,
  kcal = excluded.kcal,
  protein_g = excluded.protein_g,
  carbs_g = excluded.carbs_g,
  fat_g = excluded.fat_g,
  ingredients = excluded.ingredients;

insert into public.mindset_content (id, kind, title, body, cover_url, duration_min)
values (
  '00000000-0000-4000-8000-000000000030',
  'meditation',
  'Respiration consciente',
  E'Cinq minutes pour revenir à toi.\n\nInstalle-toi confortablement, ferme les yeux. Inspire profondément par le nez (4 secondes), bloque la respiration (4 secondes), expire lentement par la bouche (6 secondes). Répète 10 fois.\n\nObserve les sensations sans juger. Quand tu es prête, ouvre les yeux et reviens à ta journée.',
  'https://acjxdiqswpkxxezczken.supabase.co/storage/v1/object/public/mindset-media/seed/respiration.mp4',
  5
)
on conflict (id) do update set
  kind = excluded.kind,
  title = excluded.title,
  body = excluded.body,
  cover_url = excluded.cover_url,
  duration_min = excluded.duration_min;
