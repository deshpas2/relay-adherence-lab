-- 0004_seed.sql — catalog seed: barriers, quests, achievements, and four
-- sample medicines with English + Spanish explorer content.
--
-- SAMPLE CONTENT. Written to be friendly and grade-6, but NOT clinically
-- reviewed (reviewed = false). The DEAP team / care team supplies the real
-- text. Never mentions dose amounts, timing, or whether to take a medicine.
-- tests/db/seed.test.ts runs the copy-lint rules over every string here.
--
-- Demo accounts and their data are NOT here (they need auth users); see
-- supabase/seed/demo.ts.

-- Barriers --------------------------------------------------------------------
insert into public.barriers (key, label, i18n) values
  ('forget',          'I forget',                         '{"es": {"label": "Se me olvida"}}'),
  ('busy_mornings',   'My mornings are rushed',           '{"es": {"label": "Mis mañanas son muy apuradas"}}'),
  ('away_from_home',  'I am away from home',              '{"es": {"label": "Estoy fuera de casa"}}'),
  ('taste',           'I do not like the taste',          '{"es": {"label": "No me gusta el sabor"}}'),
  ('hard_to_swallow', 'Pills are hard to swallow',        '{"es": {"label": "Me cuesta tragar las pastillas"}}'),
  ('embarrassed',     'I do not want others to see',      '{"es": {"label": "No quiero que otros me vean"}}'),
  ('tired_of_meds',   'I am tired of meds',               '{"es": {"label": "Me canso de tomar medicinas"}}'),
  ('worried',         'I worry about how meds make me feel', '{"es": {"label": "Me preocupa cómo me hacen sentir"}}')
on conflict (key) do nothing;

-- Quests ------------------------------------------------------------------------
insert into public.quests (key, title, description, xp_reward, kind, i18n) values
  ('onboard', 'Welcome aboard', 'Finish setting up Relay.', 20, 'onboard',
   '{"es": {"title": "Te damos la bienvenida", "description": "Termina de preparar Relay."}}'),
  ('first_log', 'First check-in', 'Log your first dose in Relay.', 10, 'onboard',
   '{"es": {"title": "Primer registro", "description": "Anota tu primera dosis en Relay."}}'),
  ('explore_meds', 'Med explorer', 'Open each of your meds and see what it does.', 30, 'explore',
   '{"es": {"title": "Explora tus medicinas", "description": "Abre cada una de tus medicinas y mira qué hace."}}'),
  ('first_experiment', 'Your first experiment', 'Start a two-week test of a new routine.', 50, 'experiment',
   '{"es": {"title": "Tu primer experimento", "description": "Empieza una prueba de dos semanas con una nueva rutina."}}'),
  ('finish_experiment', 'Test finisher', 'Finish a two-week test and see what worked.', 100, 'experiment',
   '{"es": {"title": "Prueba terminada", "description": "Termina una prueba de dos semanas y mira qué funcionó."}}'),
  ('two_weeks_mornings', 'Two weeks of mornings', 'Log your morning meds on 14 days.', 100, 'streak',
   '{"es": {"title": "Dos semanas de mañanas", "description": "Anota tus medicinas de la mañana en 14 días."}}')
on conflict (key) do nothing;

-- Achievements ------------------------------------------------------------------
-- icon = a lucide-react icon name.
insert into public.achievements (key, title, description, icon, i18n) values
  ('first_step', 'First step', 'You logged your first dose.', 'footprints',
   '{"es": {"title": "Primer paso", "description": "Anotaste tu primera dosis."}}'),
  ('explorer', 'Explorer', 'You explored all your meds.', 'compass',
   '{"es": {"title": "Explorador", "description": "Exploraste todas tus medicinas."}}'),
  ('scientist', 'Scientist', 'You started your first experiment.', 'flask-conical',
   '{"es": {"title": "Científico", "description": "Empezaste tu primer experimento."}}'),
  ('two_week_finisher', 'Two-week finisher', 'You finished a two-week test.', 'calendar-check',
   '{"es": {"title": "Dos semanas completas", "description": "Terminaste una prueba de dos semanas."}}'),
  ('team_player', 'Team player', 'A parent saw you take your meds.', 'users',
   '{"es": {"title": "Trabajo en equipo", "description": "Tu familia te vio tomar tus medicinas."}}')
on conflict (key) do nothing;

-- Sample medicines ----------------------------------------------------------------
insert into public.medications (slug, display_name, form, color, is_sample, i18n) values
  ('tacrolimus',    'Tacrolimus',    'capsule', '#E9A23B', true, '{"es": {"display_name": "Tacrolimus"}}'),
  ('mycophenolate', 'Mycophenolate', 'tablet',  '#8B6FD6', true, '{"es": {"display_name": "Micofenolato"}}'),
  ('prednisone',    'Prednisone',    'tablet',  '#F2F0EA', true, '{"es": {"display_name": "Prednisona"}}'),
  ('amlodipine',    'Amlodipine',    'tablet',  '#5FA8D3', true, '{"es": {"display_name": "Amlodipino"}}')
on conflict (slug) do nothing;

-- Explorer content: English -----------------------------------------------------------
insert into public.medication_content (medication_id, locale, what_it_is, why_it_matters, ingredients, flow, reviewed)
select m.id, 'en', c.what_it_is, c.why_it_matters, c.ingredients::jsonb, c.flow::jsonb, false
from (values
  ('tacrolimus',
   'Tacrolimus is a medicine that helps your body keep your new kidney.',
   'Your body has a guard team. It can think your new kidney does not belong. Tacrolimus helps the guards stay calm. Then your kidney can stay safe.',
   '[{"name": "Tacrolimus", "role": "The main part", "plain": "It tells your guard cells to calm down."},
     {"name": "Capsule shell", "role": "The wrapper", "plain": "It keeps the medicine safe until it gets to your belly."},
     {"name": "Filler", "role": "The helper", "plain": "It gives the capsule its size so it is easy to hold."}]',
   '[{"step": 1, "text": "You take your medicine."},
     {"step": 2, "text": "It moves into your blood."},
     {"step": 3, "text": "It calms your guard cells."},
     {"step": 4, "text": "The guards leave your new kidney alone."},
     {"step": 5, "text": "Your kidney keeps working, and you feel well."}]'),
  ('mycophenolate',
   'Mycophenolate is a medicine that helps keep your new kidney safe.',
   'It slows down some of your guard cells. That way they do not go after your kidney. It works as a team with your other kidney meds.',
   '[{"name": "Mycophenolate", "role": "The main part", "plain": "It slows down the guard cells that could bother your kidney."},
     {"name": "Coating", "role": "The outside layer", "plain": "It makes the tablet smooth so it goes down easy."}]',
   '[{"step": 1, "text": "You take your medicine."},
     {"step": 2, "text": "It moves into your blood."},
     {"step": 3, "text": "It slows down some guard cells."},
     {"step": 4, "text": "Fewer guards go after your kidney."},
     {"step": 5, "text": "Your new kidney can do its job."}]'),
  ('prednisone',
   'Prednisone is a steroid medicine. It helps calm your body.',
   'It calms swelling. It also helps your guard cells stay quiet. This helps keep your new kidney safe.',
   '[{"name": "Prednisone", "role": "The main part", "plain": "It calms swelling and quiets your guard cells."},
     {"name": "Binder", "role": "The glue", "plain": "It holds the tablet together."}]',
   '[{"step": 1, "text": "You take your medicine."},
     {"step": 2, "text": "It moves through your body."},
     {"step": 3, "text": "It calms swelling."},
     {"step": 4, "text": "Your guard cells stay quiet."},
     {"step": 5, "text": "Your new kidney stays safe."}]'),
  ('amlodipine',
   'Amlodipine helps keep your blood pressure in a healthy range.',
   'Blood pressure is how hard your blood pushes as it moves. When it is too high, it is hard on your heart. It is hard on your kidney too. Amlodipine helps keep it in a good range.',
   '[{"name": "Amlodipine", "role": "The main part", "plain": "It helps your blood tubes relax and open up."},
     {"name": "Binder", "role": "The glue", "plain": "It holds the tablet together."}]',
   '[{"step": 1, "text": "You take your medicine."},
     {"step": 2, "text": "It helps your blood tubes relax."},
     {"step": 3, "text": "Your blood moves more easily."},
     {"step": 4, "text": "Your blood pressure stays in a good range."},
     {"step": 5, "text": "Your heart and kidney get a break."}]')
) as c (slug, what_it_is, why_it_matters, ingredients, flow)
join public.medications m on m.slug = c.slug
on conflict (medication_id, locale) do nothing;

-- Explorer content: Spanish -----------------------------------------------------------
insert into public.medication_content (medication_id, locale, what_it_is, why_it_matters, ingredients, flow, reviewed)
select m.id, 'es', c.what_it_is, c.why_it_matters, c.ingredients::jsonb, c.flow::jsonb, false
from (values
  ('tacrolimus',
   'El tacrolimus es una medicina que ayuda a tu cuerpo a quedarse con tu nuevo riñón.',
   'Tu cuerpo tiene un equipo de guardias. Puede pensar que tu nuevo riñón no es parte de ti. El tacrolimus ayuda a que los guardias se calmen. Así tu riñón está a salvo.',
   '[{"name": "Tacrolimus", "role": "La parte principal", "plain": "Les dice a tus células guardianas que se calmen."},
     {"name": "Cápsula", "role": "La envoltura", "plain": "Protege la medicina hasta que llega a tu estómago."},
     {"name": "Relleno", "role": "El ayudante", "plain": "Le da tamaño a la cápsula para que sea fácil de agarrar."}]',
   '[{"step": 1, "text": "Tomas tu medicina."},
     {"step": 2, "text": "Pasa a tu sangre."},
     {"step": 3, "text": "Calma a tus células guardianas."},
     {"step": 4, "text": "Los guardias dejan en paz tu nuevo riñón."},
     {"step": 5, "text": "Tu riñón sigue funcionando y te sientes bien."}]'),
  ('mycophenolate',
   'El micofenolato es una medicina que ayuda a cuidar tu nuevo riñón.',
   'Hace más lentas a algunas de tus células guardianas. Así no atacan tu riñón. Trabaja en equipo con tus otras medicinas para el riñón.',
   '[{"name": "Micofenolato", "role": "La parte principal", "plain": "Hace más lentas a las células guardianas que podrían molestar a tu riñón."},
     {"name": "Cubierta", "role": "La capa de afuera", "plain": "Hace que la tableta sea lisa y fácil de tragar."}]',
   '[{"step": 1, "text": "Tomas tu medicina."},
     {"step": 2, "text": "Pasa a tu sangre."},
     {"step": 3, "text": "Hace más lentas a algunas células guardianas."},
     {"step": 4, "text": "Menos guardias van contra tu riñón."},
     {"step": 5, "text": "Tu nuevo riñón puede hacer su trabajo."}]'),
  ('prednisone',
   'La prednisona es una medicina llamada esteroide. Ayuda a calmar tu cuerpo.',
   'Calma la hinchazón. También ayuda a que tus células guardianas estén tranquilas. Esto ayuda a cuidar tu nuevo riñón.',
   '[{"name": "Prednisona", "role": "La parte principal", "plain": "Calma la hinchazón y tranquiliza a tus células guardianas."},
     {"name": "Aglutinante", "role": "El pegamento", "plain": "Mantiene unida la tableta."}]',
   '[{"step": 1, "text": "Tomas tu medicina."},
     {"step": 2, "text": "Se mueve por tu cuerpo."},
     {"step": 3, "text": "Calma la hinchazón."},
     {"step": 4, "text": "Tus células guardianas están tranquilas."},
     {"step": 5, "text": "Tu nuevo riñón está a salvo."}]'),
  ('amlodipine',
   'El amlodipino ayuda a mantener tu presión arterial en un nivel sano.',
   'La presión arterial es la fuerza con la que tu sangre empuja al moverse. Si está muy alta, le cuesta a tu corazón. También le cuesta a tu riñón. El amlodipino ayuda a mantenerla en un buen nivel.',
   '[{"name": "Amlodipino", "role": "La parte principal", "plain": "Ayuda a que tus vasos sanguíneos se relajen y se abran."},
     {"name": "Aglutinante", "role": "El pegamento", "plain": "Mantiene unida la tableta."}]',
   '[{"step": 1, "text": "Tomas tu medicina."},
     {"step": 2, "text": "Ayuda a que tus vasos sanguíneos se relajen."},
     {"step": 3, "text": "Tu sangre se mueve con más facilidad."},
     {"step": 4, "text": "Tu presión arterial se queda en un buen nivel."},
     {"step": 5, "text": "Tu corazón y tu riñón descansan un poco."}]')
) as c (slug, what_it_is, why_it_matters, ingredients, flow)
join public.medications m on m.slug = c.slug
on conflict (medication_id, locale) do nothing;
