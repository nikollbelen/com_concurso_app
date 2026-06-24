-- =================================================================================
-- SEMILLA DE DESARROLLO - GUARDIANES DE AREQUIPA
-- Basado en la Propuesta Oficial (Documento Narrativo y Técnico)
-- =================================================================================
DELETE FROM auth.users WHERE email LIKE '%@guardianes.local';

TRUNCATE public.usuarios, public.teams, public.schools, public.missions, public.chapters, public.fragments, public.roles RESTART IDENTITY CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. CREACIÓN DE ROLES ESTATÍSTICOS (Sin ON CONFLICT gracias al TRUNCATE)
INSERT INTO public.roles (id, type) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'student'),
  ('22222222-2222-2222-2222-222222222222', 'leader'),
  ('33333333-3333-3333-3333-333333333333', 'director'),
  ('44444444-4444-4444-4444-444444444444', 'admin');

-- 2. CREACIÓN DE FRAGMENTOS 
INSERT INTO public.fragments (id, name, icon) VALUES 
  ('f1111111-1111-1111-1111-111111111111', 'Fragmento del Sillar', '/images/capitulo1.png'),
  ('f2222222-2222-2222-2222-222222222222', 'Fragmento del Misti', '/images/capitulo2.png'),
  ('f3333333-3333-3333-3333-333333333333', 'Fragmento del Chili', '/images/capitulo3.png'),
  ('f4444444-4444-4444-4444-444444444444', 'Fragmento de la Historia', '/images/capitulo4.png'),
  ('f5555555-5555-5555-5555-555555555555', 'Fragmento de la Cultura', '/images/capitulo5.png');

-- 3. CREACIÓN DE CAPÍTULOS
INSERT INTO public.chapters (id, title, number, id_fragment, required_level, total_missions, color) VALUES 
  ('c1111111-1111-1111-1111-111111111111', 'El Secreto del Sillar', 1, 'f1111111-1111-1111-1111-111111111111', 1, 5, '#E2E8F0'),
  ('c2222222-2222-2222-2222-222222222222', 'Las Huellas del Misti', 2, 'f2222222-2222-2222-2222-222222222222', 2, 4, '#94A3B8'),
  ('c3333333-3333-3333-3333-333333333333', 'El Legado del Chili', 3, 'f3333333-3333-3333-3333-333333333333', 3, 4, '#38BDF8'),
  ('c4444444-4444-4444-4444-444444444444', 'Ecos de la Historia', 4, 'f4444444-4444-4444-4444-444444444444', 4, 5, '#F59E0B'),
  ('c5555555-5555-5555-5555-555555555555', 'El Espíritu de la Ciudad Blanca', 5, 'f5555555-5555-5555-5555-555555555555', 5, 5, '#10B981');

-- =================================================================================
-- 4. MISIONES OFICIALES EXTRAÍDAS DEL DOCUMENTO DE PROPUESTA (24 Misiones)
-- =================================================================================
INSERT INTO public.missions (id, id_chapter, points, type, location, question, options, correct_answer) VALUES 

  -- Capítulo I: El Secreto del Sillar ('c1111111...')
  ('81111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 10, 'trivia', 'Plaza de Armas', '¿Cuántos arcos tiene una de las galerías principales de la Plaza de Armas?', '[{"label": "A", "text": "8 arcos"}, {"label": "B", "text": "10 arcos"}, {"label": "C", "text": "12 arcos"}, {"label": "D", "text": "14 arcos"}]'::json, 'C'),
  ('81111111-1111-1111-1111-111111111112', 'c1111111-1111-1111-1111-111111111111', 10, 'trivia', 'Catedral', '¿Cómo se llama el material de construcción, de color blanco y origen volcánico, que da nombre a Arequipa como "Ciudad Blanca" y que se usó para construir la Catedral?', '[{"label": "A", "text": "Granito"}, {"label": "B", "text": "Sillar"}, {"label": "C", "text": "Adobe"}, {"label": "D", "text": "Mármol"}]'::json, 'B'),
  ('81111111-1111-1111-1111-111111111113', 'c1111111-1111-1111-1111-111111111111', 10, 'trivia', 'Claustros de la Compañía', 'Los tallados en piedra de los claustros de la Compañía combinan elementos europeos con motivos de la flora y fauna andina. ¿A qué estilo arquitectónico corresponden estos tallados?', '[{"label": "A", "text": "Barroco mestizo o andino"}, {"label": "B", "text": "Gótico"}, {"label": "C", "text": "Art Decó"}, {"label": "D", "text": "Moderno"}]'::json, 'A'),
  ('81111111-1111-1111-1111-111111111114', 'c1111111-1111-1111-1111-111111111111', 10, 'trivia', 'Iglesia de la Compañía', 'La fachada de la Iglesia de la Compañía es uno de los ejemplos más representativos del arte colonial arequipeño. ¿En qué material está tallada su portada principal?', '[{"label": "A", "text": "Madera"}, {"label": "B", "text": "Sillar"}, {"label": "C", "text": "Bronce"}, {"label": "D", "text": "Yeso"}]'::json, 'B'),
  ('81111111-1111-1111-1111-111111111115', 'c1111111-1111-1111-1111-111111111111', 10, 'trivia', 'Casa del Moral', 'La Casa del Moral debe su nombre a un elemento que crece en su patio principal desde hace cerca de 300 años. ¿Qué elemento es?', '[{"label": "A", "text": "Una fuente de agua"}, {"label": "B", "text": "Un árbol de mora"}, {"label": "C", "text": "Un reloj de sol"}, {"label": "D", "text": "Una estatua de piedra"}]'::json, 'B'),

  -- Capítulo II: Las Huellas del Misti ('c2222222...')
  ('82222222-2222-2222-2222-222222222221', 'c2222222-2222-2222-2222-222222222222', 10, 'trivia', 'Mirador de Yanahuara', 'Los arcos del mirador de Yanahuara tienen frases grabadas. ¿Qué tipo de frases son las que suelen encontrarse grabadas en estos arcos?', '[{"label": "A", "text": "Frases de poetas y escritores arequipeños"}, {"label": "B", "text": "Horarios de buses"}, {"label": "C", "text": "Nombres de empresas"}, {"label": "D", "text": "Recetas de cocina"}]'::json, 'A'),
  ('82222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 10, 'trivia', 'Mirador de Carmen Alto', 'Desde el mirador de Carmen Alto se observan los andenes (terrazas agrícolas) además del volcán Misti. ¿Qué cultivo es tradicionalmente asociado a estos andenes en Arequipa?', '[{"label": "A", "text": "Café"}, {"label": "B", "text": "Arroz"}, {"label": "C", "text": "Hortalizas y alfalfa"}, {"label": "D", "text": "Cacao"}]'::json, 'C'),
  ('82222222-2222-2222-2222-222222222223', 'c2222222-2222-2222-2222-222222222222', 10, 'trivia', 'Plaza de Yanahuara', 'La iglesia principal de la Plaza de Yanahuara está construida, igual que gran parte del centro histórico, en:', '[{"label": "A", "text": "Ladrillo"}, {"label": "B", "text": "Sillar"}, {"label": "C", "text": "Concreto armado"}, {"label": "D", "text": "Adobe sin tallar"}]'::json, 'B'),
  ('82222222-2222-2222-2222-222222222224', 'c2222222-2222-2222-2222-222222222222', 10, 'trivia', 'Museo Santuarios Andinos', 'El Museo Santuarios Andinos resguarda a "Juanita", una momia inca hallada en la cima de un volcán cercano a Arequipa. ¿En qué volcán fue encontrada?', '[{"label": "A", "text": "Misti"}, {"label": "B", "text": "Ampato"}, {"label": "C", "text": "Chachani"}, {"label": "D", "text": "Pichu Pichu"}]'::json, 'B'),

  -- Capítulo III: El Legado del Chili ('c3333333...')
  ('83333333-3333-3333-3333-333333333331', 'c3333333-3333-3333-3333-333333333333', 10, 'trivia', 'Puente Bolognesi', 'El Puente Bolognesi cruza el río Chili y conecta el centro histórico con el distrito de Yanahuara. ¿Qué río cruza este puente?', '[{"label": "A", "text": "Río Chili"}, {"label": "B", "text": "Río Tambo"}, {"label": "C", "text": "Río Majes"}, {"label": "D", "text": "Río Sihuas"}]'::json, 'A'),
  ('83333333-3333-3333-3333-333333333332', 'c3333333-3333-3333-3333-333333333333', 10, 'trivia', 'Puente Grau', 'Al igual que el Puente Bolognesi, el Puente Grau es una de las vías que conecta ambas riberas del centro de Arequipa. ¿Sobre qué río se ubica?', '[{"label": "A", "text": "Río Chili"}, {"label": "B", "text": "Río Vítor"}, {"label": "C", "text": "Río Yura"}, {"label": "D", "text": "Río Andaray"}]'::json, 'A'),
  ('83333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 10, 'trivia', 'Río Chili', '¿Cuál fue uno de los usos históricos más importantes del río Chili para el desarrollo de la ciudad de Arequipa?', '[{"label": "A", "text": "Transporte de mercancía en barcos grandes"}, {"label": "B", "text": "Abastecimiento de agua para consumo, riego y energía de molinos"}, {"label": "C", "text": "Generación de electricidad mediante represas modernas únicamente"}, {"label": "D", "text": "Ninguno, el río no tuvo relevancia histórica"}]'::json, 'B'),
  ('83333333-3333-3333-3333-333333333334', 'c3333333-3333-3333-3333-333333333333', 10, 'trivia', 'Molino de Sabandía', 'En el Molino de Sabandía, ¿qué elemento del río se utilizaba para mover la maquinaria que molía el grano?', '[{"label": "A", "text": "El viento que soplaba cerca del río"}, {"label": "B", "text": "La fuerza de la corriente de agua sobre una rueda hidráulica"}, {"label": "C", "text": "Animales de carga conectados al molino"}, {"label": "D", "text": "Energía solar mediante espejos"}]'::json, 'B'),
  ('83333333-3333-3333-3333-333333333335', 'c3333333-3333-3333-3333-333333333333', 10, 'trivia', 'Tingo', 'En la zona de Tingo, el agua proveniente del río Chili se ha usado tradicionalmente para:', '[{"label": "A", "text": "Riego de cultivos y agricultura tradicional"}, {"label": "B", "text": "Producción industrial de cemento"}, {"label": "C", "text": "Únicamente actividades recreativas"}, {"label": "D", "text": "Generación de energía nuclear"}]'::json, 'A'),

  -- Capítulo IV: Ecos de la Historia ('c4444444...')
  ('84444444-4444-4444-4444-444444444441', 'c4444444-4444-4444-4444-444444444444', 10, 'trivia', 'Casa Museo Mario Vargas Llosa', 'La Casa Museo Mario Vargas Llosa, ubicada en la Avenida Parra, está dedicada al escritor arequipeño ganador del Premio Nobel de Literatura en el año:', '[{"label": "A", "text": "2005"}, {"label": "B", "text": "2010"}, {"label": "C", "text": "2015"}, {"label": "D", "text": "2020"}]'::json, 'B'),
  ('84444444-4444-4444-4444-444444444442', 'c4444444-4444-4444-4444-444444444444', 10, 'trivia', 'Museo Histórico Municipal', 'El Museo Histórico Municipal de Arequipa exhibe objetos y documentos relacionados principalmente con:', '[{"label": "A", "text": "La historia y los personajes de Arequipa"}, {"label": "B", "text": "La gastronomía internacional"}, {"label": "C", "text": "La tecnología moderna"}, {"label": "D", "text": "El deporte mundial"}]'::json, 'A'),
  ('84444444-4444-4444-4444-444444444443', 'c4444444-4444-4444-4444-444444444444', 10, 'trivia', 'Plaza San Francisco', 'La Plaza San Francisco se encuentra junto al conjunto religioso del mismo nombre, vinculado a la orden:', '[{"label": "A", "text": "Franciscana"}, {"label": "B", "text": "Jesuita"}, {"label": "C", "text": "Dominica"}, {"label": "D", "text": "Benedictina"}]'::json, 'A'),
  ('84444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 10, 'trivia', 'Teatro Municipal', 'El Teatro Municipal de Arequipa es uno de los espacios culturales más antiguos de la ciudad y se utiliza principalmente para:', '[{"label": "A", "text": "Presentaciones artísticas y culturales (teatro, música, danza)"}, {"label": "B", "text": "Eventos deportivos de gran aforo"}, {"label": "C", "text": "Exposiciones de maquinaria industrial"}, {"label": "D", "text": "Ferias de comida exclusivamente"}]'::json, 'A'),
  ('84444444-4444-4444-4444-444444444445', 'c4444444-4444-4444-4444-444444444444', 10, 'trivia', 'Barrio Tradicional', 'Al recorrer un barrio tradicional del centro histórico de Arequipa, ¿qué elemento es característico de su arquitectura y evidencia su origen colonial?', '[{"label": "A", "text": "Calles empedradas y fachadas de sillar"}, {"label": "B", "text": "Edificios de vidrio y acero"}, {"label": "C", "text": "Avenidas de seis carriles"}, {"label": "D", "text": "Centros comerciales modernos"}]'::json, 'A'),

  -- Capítulo V: El Espíritu de la Ciudad Blanca ('c5555555...')
  ('85555555-5555-5555-5555-555555555551', 'c5555555-5555-5555-5555-555555555555', 10, 'trivia', 'Mercado San Camilo', 'El Mercado San Camilo es uno de los mercados tradicionales más representativos de Arequipa. ¿Qué tipo de productos es típico encontrar en sus puestos?', '[{"label": "A", "text": "Productos agrícolas, quesos y ajíes típicos de la región"}, {"label": "B", "text": "Únicamente ropa importada"}, {"label": "C", "text": "Solo productos electrónicos"}, {"label": "D", "text": "Solo artesanías de otros países"}]'::json, 'A'),
  ('85555555-5555-5555-5555-555555555552', 'c5555555-5555-5555-5555-555555555555', 10, 'trivia', 'Centro Cultural', 'Los centros culturales de Arequipa suelen exhibir y promover expresiones artísticas como:', '[{"label": "A", "text": "Música, danza y artes plásticas regionales"}, {"label": "B", "text": "Solo cine internacional"}, {"label": "C", "text": "Únicamente videojuegos"}, {"label": "D", "text": "Solo moda extranjera"}]'::json, 'A'),
  ('85555555-5555-5555-5555-555555555553', 'c5555555-5555-5555-5555-555555555555', 10, 'trivia', 'Picantería Tradicional', 'Las picanterías tradicionales de Arequipa son reconocidas por servir platos típicos como el rocoto relleno o el chupe de camarones. Estos platos forman parte de:', '[{"label": "A", "text": "La gastronomía tradicional arequipeña"}, {"label": "B", "text": "La comida rápida internacional"}, {"label": "C", "text": "La repostería europea"}, {"label": "D", "text": "La cocina asiática exclusivamente"}]'::json, 'A'),
  ('85555555-5555-5555-5555-555555555554', 'c5555555-5555-5555-5555-555555555555', 10, 'trivia', 'Plaza de Armas (evento especial)', 'En la Plaza de Armas de Arequipa conviven elementos que representan la identidad de la ciudad, como su arquitectura de sillar y sus símbolos históricos. ¿Cuál de los siguientes es uno de esos elementos representativos?', '[{"label": "A", "text": "La arquitectura de sillar de sus edificios históricos"}, {"label": "B", "text": "Rascacielos de vidrio"}, {"label": "C", "text": "Un estadio de fútbol"}, {"label": "D", "text": "Un puerto marítimo"}]'::json, 'A'),
  ('85555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 15, 'creative', 'Espacio Cultural Designado', 'Este desafío no se valida por opción múltiple: el equipo debe completar una actividad creativa relacionada con las tradiciones de Arequipa frente al docente/líder.', '[{"label": "A", "text": "Actividad creativa completada y evaluada presencialmente"}]'::json, 'A');

-- =================================================================================
-- 4.5 CREACIÓN DEL USUARIO ADMINISTRADOR (SUPER ADMIN)
-- ¡Corrección! Todos los campos vacíos requeridos por GoTrue han sido restaurados
-- =================================================================================
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
  confirmation_token, recovery_token, email_change_token_new, email_change
) 
VALUES (
  '97375ed6-bd60-413f-a496-e245e54c2348', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
  'asistem@guardianes.local', extensions.crypt('secreto123', extensions.gen_salt('bf')), now(), 
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), 
  '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.usuarios (id, alias, nombre, apellidos, role_id, school_id, team_id)
VALUES ('97375ed6-bd60-413f-a496-e245e54c2348', 'asistem', 'Admin', 'Sistema', '44444444-4444-4444-4444-444444444444', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET alias = EXCLUDED.alias, nombre = EXCLUDED.nombre, apellidos = EXCLUDED.apellidos, role_id = EXCLUDED.role_id;


-- =================================================================================
-- 5. GENERACIÓN MASIVA E INTELIGENTE DE ESCUELAS, EQUIPOS Y USUARIOS
-- =================================================================================
DO $$
DECLARE
  v_role_student uuid := '11111111-1111-1111-1111-111111111111';
  v_role_leader uuid := '22222222-2222-2222-2222-222222222222';
  v_role_director uuid := '33333333-3333-3333-3333-333333333333';
  v_dummy_hash text := extensions.crypt('secreto123', extensions.gen_salt('bf'));
  v_nombre text; v_apellido text; v_alias text; v_email text;
  v_school_id uuid; v_team_id bigint; v_leader_id uuid; v_student_id uuid; v_director_id uuid;
  v_school_names text[] := ARRAY['Colegio Independencia Americana', 'I.E. San Francisco', 'Colegio San José', 'Nuestra Señora del Pilar', 'Colegio La Salle'];
  v_school_short_names text[] := ARRAY['Independencia', 'San Francisco', 'San José', 'Pilar', 'La Salle'];
  v_school_colors text[] := ARRAY['#7C3AED', '#DC2626', '#2563EB', '#059669', '#D97706'];
  v_nombres text[] := ARRAY['Mateo', 'Lucía', 'Diego', 'Camila', 'Leonardo', 'Valeria', 'Sebastián', 'Sofía', 'Matías', 'Mariana', 'Joaquín', 'Valentina', 'Gabriel', 'Isabella', 'Tomás', 'Antonella', 'Alejandro', 'Daniela', 'Lucas', 'Renata'];
  v_apellidos text[] := ARRAY['Mamani', 'Quispe', 'Condori', 'Flores', 'Rodríguez', 'Huamán', 'Cárdenas', 'Vargas', 'Paredes', 'Mendoza', 'Fernández', 'Cáceres', 'Zúñiga', 'Carpio', 'Málaga', 'Pinto'];
  i int; j int; k int;
BEGIN
    FOR i IN 1..5 LOOP
      v_school_id := gen_random_uuid();
      INSERT INTO public.schools (id, name, short, color, points, missions_completed) VALUES (v_school_id, v_school_names[i], v_school_short_names[i], v_school_colors[i], 0, 0);

      -- Director
      v_director_id := gen_random_uuid();
      v_nombre := v_nombres[floor(random() * array_length(v_nombres, 1) + 1)];
      v_apellido := v_apellidos[floor(random() * array_length(v_apellidos, 1) + 1)];
      v_alias := lower(substring(v_nombre from 1 for 1)) || lower(v_apellido) || '_dir_' || i;
      v_email := v_alias || '@guardianes.local'; 
      
      -- ¡Corrección! Campos vacíos y metadata añadidos en el INSERT de auth.users
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) 
      VALUES (v_director_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email, v_dummy_hash, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '') ON CONFLICT (id) DO NOTHING;
      
      INSERT INTO public.usuarios (id, alias, nombre, apellidos, role_id, school_id) VALUES (v_director_id, v_alias, v_nombre, v_apellido, v_role_director, v_school_id)
      ON CONFLICT (id) DO UPDATE SET alias = EXCLUDED.alias, nombre = EXCLUDED.nombre, apellidos = EXCLUDED.apellidos, role_id = EXCLUDED.role_id, school_id = EXCLUDED.school_id;

      FOR j IN 1..3 LOOP
        -- Profesor
        v_leader_id := gen_random_uuid();
        v_nombre := v_nombres[floor(random() * array_length(v_nombres, 1) + 1)];
        v_apellido := v_apellidos[floor(random() * array_length(v_apellidos, 1) + 1)];
        v_alias := lower(substring(v_nombre from 1 for 1)) || lower(v_apellido) || '_prof_' || i || '_' || j;
        v_email := v_alias || '@guardianes.local'; 
        
        -- ¡Corrección! Campos vacíos y metadata
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) 
        VALUES (v_leader_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email, v_dummy_hash, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '') ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public.usuarios (id, alias, nombre, apellidos, role_id, school_id) VALUES (v_leader_id, v_alias, v_nombre, v_apellido, v_role_leader, v_school_id)
        ON CONFLICT (id) DO UPDATE SET alias = EXCLUDED.alias, nombre = EXCLUDED.nombre, apellidos = EXCLUDED.apellidos, role_id = EXCLUDED.role_id, school_id = EXCLUDED.school_id;

        INSERT INTO public.teams (name, leader_id, school_id, points, level) VALUES ('Equipo '||j||' Esc '||i, v_leader_id, v_school_id, 0, 1) RETURNING id INTO v_team_id;
        UPDATE public.usuarios SET team_id = v_team_id WHERE id = v_leader_id;

        -- Alumnos
        FOR k IN 1..5 LOOP
          v_student_id := gen_random_uuid();
          v_nombre := v_nombres[floor(random() * array_length(v_nombres, 1) + 1)];
          v_apellido := v_apellidos[floor(random() * array_length(v_apellidos, 1) + 1)];
          v_alias := lower(substring(v_nombre from 1 for 1)) || lower(v_apellido) || '_' || i || '_' || j || '_' || k;
          v_email := v_alias || '@guardianes.local'; 
          
          -- ¡Corrección! Campos vacíos y metadata
          INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) 
          VALUES (v_student_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email, v_dummy_hash, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '') ON CONFLICT (id) DO NOTHING;
          
          INSERT INTO public.usuarios (id, alias, nombre, apellidos, role_id, school_id, team_id) VALUES (v_student_id, v_alias, v_nombre, v_apellido, v_role_student, v_school_id, v_team_id)
          ON CONFLICT (id) DO UPDATE SET alias = EXCLUDED.alias, nombre = EXCLUDED.nombre, apellidos = EXCLUDED.apellidos, role_id = EXCLUDED.role_id, school_id = EXCLUDED.school_id, team_id = EXCLUDED.team_id;
        END LOOP;
      END LOOP;
    END LOOP;
END $$;