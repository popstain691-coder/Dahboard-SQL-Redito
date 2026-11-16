-- Seguridad (RLS), vista del feed y funciones. Ejecutar DESPUÉS de 01 y 02.

-- ¿El usuario que hace la consulta es admin?
create function public.es_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.usuario
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- Permisos básicos de las tablas para usuarios con sesión (RLS decide qué filas)
grant usage on schema public to authenticated;
grant select, update on public.usuario to authenticated;
grant select, insert, update, delete on public.comunidad to authenticated;
grant select, insert, delete on public.publicacion to authenticated;

alter table public.usuario enable row level security;
alter table public.comunidad enable row level security;
alter table public.publicacion enable row level security;

-- USUARIO: cada quien ve y edita lo suyo; el admin ve y edita todo
create policy "ver perfil propio o admin" on public.usuario
  for select to authenticated
  using (id = auth.uid() or public.es_admin());

create policy "editar perfil propio o admin" on public.usuario
  for update to authenticated
  using (id = auth.uid() or public.es_admin());

-- Nadie puede cambiarse el rol desde la app: solo un admin o el panel de Supabase
create function public.proteger_rol()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.rol <> old.rol and auth.uid() is not null and not public.es_admin() then
    raise exception 'Solo un admin puede cambiar el rol';
  end if;
  return new;
end;
$$;

create trigger antes_de_editar_usuario
  before update on public.usuario
  for each row execute function public.proteger_rol();

-- COMUNIDAD: todos las ven; cualquiera crea; solo su creador o un admin edita/borra
create policy "ver comunidades" on public.comunidad
  for select to authenticated using (true);

create policy "crear comunidad propia" on public.comunidad
  for insert to authenticated with check (creador_id = auth.uid());

create policy "editar comunidad propia o admin" on public.comunidad
  for update to authenticated
  using (creador_id = auth.uid() or public.es_admin());

create policy "borrar comunidad propia o admin" on public.comunidad
  for delete to authenticated
  using (creador_id = auth.uid() or public.es_admin());

-- PUBLICACION: todos las ven; cada quien publica a su nombre; edita/borra lo suyo (admin todo)
create policy "ver publicaciones" on public.publicacion
  for select to authenticated using (true);

create policy "publicar a mi nombre" on public.publicacion
  for insert to authenticated with check (autor_id = auth.uid());

create policy "editar publicacion propia o admin" on public.publicacion
  for update to authenticated
  using (autor_id = auth.uid() or public.es_admin());

create policy "borrar publicacion propia o admin" on public.publicacion
  for delete to authenticated
  using (autor_id = auth.uid() or public.es_admin());

-- Los votos NO se editan a mano: solo con la función votar() de más abajo
revoke update on public.publicacion from anon, authenticated;
grant update (titulo, contenido, imagen_url, comunidad_id)
  on public.publicacion to authenticated;

-- VISTA del feed: publicación + nombre de comunidad + nombre del autor.
-- Así el feed no necesita leer la tabla usuario (que tiene correo y teléfono).
create view public.v_publicacion as
  select p.id, p.titulo, p.contenido, p.imagen_url, p.votos,
         p.comunidad_id, c.nombre as comunidad_nombre,
         p.autor_id, u.nombre as autor_nombre, p.creado_en
  from public.publicacion p
  join public.comunidad c on c.id = p.comunidad_id
  join public.usuario u on u.id = p.autor_id;

revoke all on public.v_publicacion from anon;
grant select on public.v_publicacion to authenticated;

-- FUNCIONES que llama la app con supabase.rpc(...)
-- votar: suma o resta votos a una publicación (delta entre -2 y 2)
create function public.votar(p_id bigint, delta integer)
returns void
language sql
security definer set search_path = ''
as $$
  update public.publicacion
  set votos = votos + greatest(-2, least(2, delta))
  where id = p_id and auth.uid() is not null;
$$;

-- eliminar_mi_cuenta: borra la cuenta de quien tiene la sesión (cascada: perfil, posts)
create function public.eliminar_mi_cuenta()
returns void
language sql
security definer set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

-- admin_eliminar_usuario: solo admins; borra la cuenta completa de otra persona
create function public.admin_eliminar_usuario(p_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo un admin puede eliminar usuarios';
  end if;
  if p_id = auth.uid() then
    raise exception 'No puedes eliminarte a ti mismo desde el panel';
  end if;
  delete from auth.users where id = p_id;
end;
$$;

-- Las funciones solo las llama gente con sesión (no anónimos)
revoke execute on function public.votar(bigint, integer) from public, anon;
revoke execute on function public.eliminar_mi_cuenta() from public, anon;
revoke execute on function public.admin_eliminar_usuario(uuid) from public, anon;
grant execute on function public.votar(bigint, integer) to authenticated;
grant execute on function public.eliminar_mi_cuenta() to authenticated;
grant execute on function public.admin_eliminar_usuario(uuid) to authenticated;
