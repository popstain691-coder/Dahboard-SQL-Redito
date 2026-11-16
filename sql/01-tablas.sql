-- Redito (réplica de Reddit): TRES tablas.
-- Ejecuta este archivo primero en Supabase → SQL Editor → Run (elige "Run and enable RLS").

-- 1. Perfil de cada persona: una fila por cada cuenta de Authentication
create table public.usuario (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  correo text unique not null,
  fecha_nacimiento date,
  telefono text,
  bio text,
  rol text not null default 'usuario' check (rol in ('usuario', 'admin')),
  creado_en timestamptz not null default now()
);

-- 2. Comunidades (los "subreddits"): c/programacion, c/memes...
create table public.comunidad (
  id bigint generated always as identity primary key,
  nombre text unique not null check (nombre ~ '^[a-z0-9_]{3,21}$'),
  descripcion text,
  creador_id uuid not null references public.usuario (id) on delete cascade,
  creado_en timestamptz not null default now()
);

-- 3. Publicaciones (los "posts") de cada comunidad
create table public.publicacion (
  id bigint generated always as identity primary key,
  titulo text not null check (char_length(titulo) between 1 and 300),
  contenido text,
  imagen_url text,
  votos integer not null default 0,
  comunidad_id bigint not null references public.comunidad (id) on delete cascade,
  autor_id uuid not null references public.usuario (id) on delete cascade,
  creado_en timestamptz not null default now()
);

create index on public.publicacion (comunidad_id);
create index on public.publicacion (autor_id);
