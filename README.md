# Redito — réplica de Reddit con React + Supabase

App tipo Reddit: comunidades (`c/nombre`), publicaciones con imagen, votos, perfil de usuario y panel de administración protegido con RLS. Se convierte en APK de Android con Capacitor.

**Stack:** React + Vite · Supabase (Auth + PostgreSQL + RLS) · Bootstrap 5 · Capacitor

## Las 3 tablas

| Tabla | Qué guarda |
|---|---|
| `usuario` | Perfil (id = cuenta de Auth, nombre, correo, fecha de nacimiento, teléfono, bio, rol) |
| `comunidad` | Los "subreddits" (nombre, descripción, creador) |
| `publicacion` | Posts (título, texto, imagen, votos, comunidad, autor) |

## 1. Base de datos

En **SQL Editor** de Supabase ejecuta en orden:

| Archivo | Qué hace |
|---|---|
| `sql/01-tablas.sql` | Crea las 3 tablas |
| `sql/02-trigger.sql` | Crea el perfil automáticamente al registrarse |
| `sql/03-rls.sql` | Políticas RLS, vista `v_publicacion` y funciones (`votar`, `eliminar_mi_cuenta`, `admin_eliminar_usuario`) |
| `sql/04-datos.sql` | Datos de prueba (antes crea `admin@prueba.com`, `ana@prueba.com`, `luis@prueba.com` en Authentication) |
| `sql/05-verificar.sql` | Comprueba que todo quedó bien |

## 2. Correr la app

1. Copia `.env.example` como `.env` y pega la URL y la clave **publicable** (Supabase → Connect → React → Vite).
2. `npm install` y `npm run dev`.

## 3. Qué hace cada pantalla

| Ruta | Pantalla |
|---|---|
| `/login`, `/registro` | Autenticación con Supabase Auth |
| `/` y `/c/:nombre` | Feed: ordenar (Popular/Nuevo/Top), buscar, votar |
| `/comunidades` | Explorar y crear comunidades |
| `/publicar`, `/publicar/:id` | Crear y editar publicaciones |
| `/perfil` | CRUD del usuario: editar datos, mis posts, eliminar mi cuenta |
| `/admin` | CRUD administrativo: usuarios (editar, cambiar rol, eliminar), comunidades y publicaciones |

Reglas de RLS: cada quien edita/borra solo lo suyo; el admin todo; el rol solo lo cambia un admin; los votos solo cambian con `votar()`.

## 4. APK

**Con GitHub Actions (sin Android Studio):** sube el repo, crea los secretos `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (Settings → Secrets and variables → Actions) y corre **Compilar APK** en la pestaña Actions. Descarga `app-debug` en Artifacts.

**Local:**

```bash
npm run build
npx cap add android
npx capacitor-assets generate --android   # ícono y splash desde assets/
npx cap sync android
```

Luego abre la carpeta `android` en Android Studio → Build → Generate APKs.

## Notas

- Los votos no guardan quién votó (solo hay 3 tablas): el voto de cada persona se recuerda en el dispositivo para poder quitarlo o cambiarlo.
- `estilo.css` solo ajusta colores y medidas al estilo Reddit sobre Bootstrap.
- El logo e ícono son originales (globo con flecha), no usan la imagen de Reddit.
