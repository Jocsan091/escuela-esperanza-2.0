# Noticias con Supabase

Este proyecto ya quedo preparado para que las noticias funcionen desde Supabase
en cualquier hosting estatico.

## Lo que ya hace el frontend

- Home:
  - carga las ultimas 3 noticias publicadas
  - muestra imagen, fecha, titulo en negrita y texto resumido
- `/noticias/`
  - muestra todas las noticias publicadas con texto completo
- `/admin/noticias/`
  - login admin
  - crear noticia
  - editar noticia
  - eliminar noticia
  - subir imagen
  - usar imagen predeterminada si no se sube una

## Variables necesarias

Crear `.env` a partir de `.env.example` y completar:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_SUPABASE_STORAGE_BUCKET`

## SQL recomendado

```sql
create table if not exists public.noticias (
  id bigint generated always as identity primary key,
  titulo text not null,
  contenido text not null,
  imagen_url text,
  fecha_publicacion timestamptz not null default now(),
  publicada boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.noticias enable row level security;

create policy "lectura publica noticias"
on public.noticias
for select
to public
using (publicada = true);

create policy "admin autenticado gestiona noticias"
on public.noticias
for all
to authenticated
using (true)
with check (true);
```

## Storage recomendado

Crear bucket publico llamado `noticias`.

Politicas sugeridas del bucket:

- lectura publica para ver imagenes
- insercion, actualizacion y borrado para usuarios autenticados

## Cuenta admin

Crear en Supabase Auth un usuario administrador con correo y contrasena.

Ese usuario entrara por:

- `/admin/noticias/`

## Flujo

1. El admin inicia sesion
2. Sube imagen, titulo y texto
3. La noticia se guarda en Supabase
4. La home muestra las ultimas 3
5. `/noticias/` muestra todas las publicadas

## Importante

La seguridad de "solo admin edita" depende de Supabase Auth y sus politicas.
El frontend ya esta preparado para eso.
