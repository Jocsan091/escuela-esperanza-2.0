# Noticias: base recomendada

Esta guia deja clara la arquitectura recomendada para el modulo de noticias.

## Objetivo

- Publico:
  - ver ultimas noticias en la home
  - ver todas las noticias en `/noticias/`
- Admin:
  - iniciar sesion
  - crear noticias
  - editar noticias
  - eliminar noticias
  - subir imagen o usar imagen por defecto

## Recomendacion tecnica

Usar `Astro` como frontend y `Supabase` como backend.

Esto permite:

- cambiar el hosting del frontend sin rehacer el modulo
- usar base de datos, auth y storage en un solo servicio
- mantener separado el sitio publico del panel admin

## Tabla recomendada

Tabla: `noticias`

Campos:

- `id`
- `titulo`
- `contenido`
- `imagen_url`
- `fecha_publicacion`
- `publicada`
- `created_at`
- `updated_at`

## Reglas sugeridas

- El publico solo puede leer noticias con `publicada = true`
- El admin autenticado puede crear, editar y eliminar
- Si no hay imagen, usar la imagen predeterminada del proyecto

## Flujo del frontend

- Home:
  - consulta ultimas 3 noticias publicadas
- `/noticias/`
  - consulta todas las noticias publicadas
- `/admin/noticias/`
  - lista noticias del admin
  - formulario para crear
  - acciones para editar y eliminar

## Siguiente paso recomendado

1. Crear proyecto en Supabase
2. Crear tabla `noticias`
3. Crear bucket de imagenes
4. Configurar login admin
5. Conectar Astro con variables de entorno
6. Reemplazar el `noticiasSeed` vacio por lecturas reales desde Supabase
