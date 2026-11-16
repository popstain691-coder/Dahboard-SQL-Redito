-- Datos de prueba. Antes crea 3 usuarios en Authentication → Users → Add user
-- (con "Auto confirm user"): admin@prueba.com, ana@prueba.com y luis@prueba.com

-- Volver admin a un usuario (solo se puede desde Supabase)
update public.usuario set rol = 'admin', nombre = 'admin_prueba'
where correo = 'admin@prueba.com';

update public.usuario set nombre = 'ana_rojas', telefono = '3109876543',
  fecha_nacimiento = '2003-04-02', bio = 'Me gusta programar y los gatos.'
where correo = 'ana@prueba.com';

update public.usuario set nombre = 'luis_gomez', telefono = '3205550101',
  fecha_nacimiento = '2002-11-20', bio = 'Memes, música y café.'
where correo = 'luis@prueba.com';

-- Comunidades
insert into public.comunidad (nombre, descripcion, creador_id)
select d.nombre, d.descripcion, u.id
from public.usuario u
join (values
  ('admin@prueba.com', 'programacion', 'Dudas, trucos y noticias de código.'),
  ('admin@prueba.com', 'colombia',     'Todo sobre Colombia.'),
  ('ana@prueba.com',   'fotografia',   'Comparte tus mejores fotos.'),
  ('luis@prueba.com',  'memes',        'Los mejores memes del día.')
) as d(correo, nombre, descripcion) on d.correo = u.correo;

-- Publicaciones
insert into public.publicacion (titulo, contenido, imagen_url, votos, comunidad_id, autor_id)
select d.titulo, d.contenido, d.imagen, d.votos, c.id, u.id
from public.usuario u
join (values
  ('ana@prueba.com',   'programacion', '¿React o Vue para empezar?', 'Llevo un mes con JavaScript y no sé cuál elegir. ¿Consejos?', null, 42),
  ('luis@prueba.com',  'programacion', 'Mi primer APK con Capacitor', 'Convertí mi página web en app Android sin Android Studio.', null, 18),
  ('ana@prueba.com',   'fotografia',   'Atardecer en la montaña', null, 'https://picsum.photos/id/29/800/500', 120),
  ('luis@prueba.com',  'fotografia',   'Mi gato dormido', 'Así pasa todo el día.', 'https://picsum.photos/id/40/800/500', 87),
  ('luis@prueba.com',  'memes',        'Cuando compila a la primera', null, 'https://picsum.photos/id/237/800/500', 250),
  ('admin@prueba.com', 'colombia',     'Bienvenidos a c/colombia', 'Reglas: respeto ante todo. ¡Cuéntennos de dónde son!', null, 33)
) as d(correo, comunidad, titulo, contenido, imagen, votos) on d.correo = u.correo
join public.comunidad c on c.nombre = d.comunidad;
