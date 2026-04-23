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

Ejemplo:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
PUBLIC_SUPABASE_STORAGE_BUCKET=noticias
```

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

Si quieres mantener `updated_at` sincronizado al editar, puedes agregar:

```sql
create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_noticias_updated_at on public.noticias;

create trigger set_noticias_updated_at
before update on public.noticias
for each row
execute function public.set_current_timestamp_updated_at();
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
2. Completa imagen, titulo, texto y define si la noticia queda publicada
3. La noticia se guarda en Supabase
4. La home muestra las ultimas 3 publicadas
5. `/noticias/` muestra todas las publicadas
6. Los borradores solo aparecen en el panel admin

## Checklist rapido

1. Crear tabla `noticias`
2. Activar RLS
3. Crear politicas
4. Crear bucket `noticias`
5. Crear usuario admin en Supabase Auth
6. Completar `.env`
7. Ejecutar `npm run dev`
8. Entrar a `/admin/noticias/` y crear la primera noticia

## Importante

La seguridad de "solo admin edita" depende de Supabase Auth y sus politicas.
El frontend ya esta preparado para eso.
