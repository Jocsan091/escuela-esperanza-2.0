# Escuela Esperanza

Sitio institucional construido con Astro para la Escuela Esperanza.

## Rutas principales

- `/`
- `/quienes-somos/`
- `/noticias/`
- `/admin/noticias/`

## Seccion de noticias

La seccion de noticias tiene dos vistas:

- Vista publica:
  - muestra las noticias publicadas para cualquier visitante
  - la portada carga las 3 noticias mas recientes
  - la pagina `/noticias/` muestra el listado completo
- Vista administrador:
  - permite iniciar sesion
  - crear noticias
  - editar noticias
  - eliminar noticias
  - guardar noticias como publicadas o borrador
  - subir una imagen o usar la imagen predeterminada

La integracion esta documentada en [docs/noticias-supabase.md](./docs/noticias-supabase.md).

## Variables de entorno

Crea un archivo `.env` usando `.env.example` como referencia.

```env
PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
PUBLIC_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
PUBLIC_SUPABASE_STORAGE_BUCKET=noticias
```

## Comandos

- `npm run dev`
- `npm run build`
- `npm run preview`
