# Guía de despliegue independiente

## 1. Repositorio GitHub
- Crea un nuevo repositorio en GitHub para esta copia.
- Sube este proyecto completo a ese repositorio.
- No lo dejes ligado al repositorio de la otra app.

## 2. Supabase independiente
- Crear un nuevo proyecto en Supabase.
- Copiar la URL del proyecto y la anon key.
- Ponerlas en el archivo .env:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
- También configurar la URL de redirección de auth si es necesario:
  - http://localhost:5173
  - https://tu-dominio.vercel.app

## 3. Vercel independiente
- Crear un nuevo proyecto en Vercel.
- Conectar el repositorio nuevo de GitHub.
- Añadir estas variables de entorno en Vercel:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_APP_URL = https://tu-dominio.vercel.app
- Desplegar.

## 4. Importante
- No reutilizar las credenciales del otro proyecto.
- No compartir la misma base de datos.
- Cada app debe tener su propia autenticación y su propio conjunto de tablas.

## 5. Verificar
- Abrir la URL de Vercel.
- Probar registro e inicio de sesión.
- Probar el dashboard.
