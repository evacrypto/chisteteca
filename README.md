# Chisteteca

Aplicación web de humor con backend Express + MongoDB y frontend React + Vite.

Este README está pensado como punto de entrada único para cualquier colaborador que necesite levantar el proyecto y probarlo como usuario normal y como admin.

## Resumen rápido

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Healthcheck backend: `http://localhost:5000/api/health`
- Base de datos esperada: MongoDB local
- Sección de descubrimiento principal: `Populares`
- Criterio de `Populares`: contenidos aprobados de los últimos 7 días, ordenados por número de likes

## Stack

### Backend
- Node.js 18+
- Express
- MongoDB + Mongoose
- JWT
- Multer
- Helmet
- Morgan

### Frontend
- React 18
- Vite
- React Router
- Bootstrap + React Bootstrap
- Zustand
- Axios
- React Toastify

## Prerrequisitos

- Node.js 18 o superior
- MongoDB ejecutándose en local o una URI accesible

## Variables de entorno

Antes de arrancar, crea estos archivos a partir de los ejemplos incluidos:

### Backend

Archivo: `backend/.env`

Variables mínimas:
- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`
- `FRONTEND_URL`
- `NODE_ENV`

### Frontend

Archivo: `frontend/.env`

Variables mínimas:
- `VITE_API_URL`

Si usas la configuración local estándar, los valores por defecto de los ejemplos ya sirven.

#### Cloudflare R2 (producción: Railway, etc.)

En entornos con disco efímero (p. ej. Railway), los avatares se pierden al redeployar. Para almacenamiento persistente, configura Cloudflare R2:

1. Crea un bucket en [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 → Create bucket
2. Crea un API token: R2 → Manage R2 API Tokens → Create API token
3. Habilita acceso público al bucket y copia la URL pública (ej: `https://pub-xxx.r2.dev`)
4. Añade en Railway (o tu hosting) las variables:
   - `R2_ACCOUNT_ID` (tu Account ID de Cloudflare)
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_URL` (URL pública del bucket)

Sin R2 configurado, los avatares se guardan en disco (funciona en local, se pierden en deploys).

## Instalación

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Seed de base de datos

Para preparar datos de prueba:

```bash
cd backend
npm run seed
```

El seed actual crea:
- 1 admin: `info@chisteteca.es` / `admin123`
- 3 usuarios demo: `sofia@chisteteca.com`, `diego@chisteteca.com`, `marta@chisteteca.com`
- Password de usuarios demo: `demo1234`
- 6 categorías activas
- 4 contenidos de ejemplo

## Ejecución local

### Opción 1: manual

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

### Opción 2: scripts de Windows

- `iniciar.bat`: arranca backend y frontend
- `detener.bat`: detiene procesos `node.exe`
- `monitor.bat`: monitoriza y reintenta levantar servicios si se caen

## Qué debe probar un colaborador

### Flujo como usuario normal

Puede usar uno de los usuarios demo o registrarse en `/register`.

Pruebas recomendadas:
1. Login
2. Explorar Home
3. Abrir `Populares`
4. Abrir `Aleatorio`
5. Dar like a un contenido
6. Comentar en un contenido
7. Crear un chiste
8. Crear una sugerencia de categoría desde el formulario de creación

### Flujo como admin

Credenciales:
- Email: `info@chisteteca.es`
- Password: `admin123`

Pruebas recomendadas:
1. Login como admin
2. Abrir panel `/admin`
3. Aprobar o rechazar contenido pendiente
4. Revisar categorías pendientes
5. Ver gestión de usuarios
6. Eliminar contenido o categorías si hace falta
7. Crear contenido como admin y comprobar autoaprobación
8. Sugerir una categoría como admin y comprobar autoaprobación

## Comandos disponibles

### Backend

```bash
npm run dev               # Desarrollo con nodemon
npm start                 # Arranque simple
npm run seed              # Seed principal
npm run backfill:content-creators
npm run clean:orphan-content
npm run qa:handoff        # Seed + escaneo legacy + flujo E2E
npm run qa:e2e            # Flujo E2E user/admin
npm run qa:scan-legacy    # Escaneo de referencias legacy
```

Nota: `npm test` no es una suite real en este proyecto actualmente. No debe usarse como criterio de validación.

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

## Rutas clave de producto

- `/` home
- `/popular` populares de la semana
- `/random` contenido aleatorio
- `/create` crear contenido
- `/admin` panel admin
- `/login`
- `/register`

## Estado funcional relevante

- Autenticación funcional
- Panel admin funcional
- Likes funcionales
- Comentarios funcionales
- Creación de chistes, imágenes y videos
- Categorías con sugerencia y moderación
- `Populares` calculado por likes semanales
- Menú móvil desplegable

## Estructura del proyecto

```text
chisteteca/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── validators/
│   ├── qa/
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/
│   └── package.json
├── iniciar.bat
├── detener.bat
└── monitor.bat
```

## Solución de problemas

### La app no conecta con la API
- Verifica backend en `http://localhost:5000`
- Verifica `frontend/.env`
- Revisa `http://localhost:5000/api/health`

### MongoDB no conecta
- Verifica `backend/.env`
- Verifica que `MONGODB_URI` sea correcta
- Si es local, asegúrate de que MongoDB esté arrancado

### No aparecen contenidos en Home o Populares
- Verifica que el seed se ejecutó
- Verifica que el contenido esté aprobado
- En `Populares`, recuerda que solo cuentan contenidos de los últimos 7 días

### El colaborador necesita cuentas de prueba
- Admin: `info@chisteteca.es` / `admin123`
- Demo user: `sofia@chisteteca.com` / `demo1234`
- Demo user: `diego@chisteteca.com` / `demo1234`
- Demo user: `marta@chisteteca.com` / `demo1234`

## Checklist antes de enviar

Si vas a pasar este proyecto ahora mismo a otra persona, haz esto justo antes:

1. Copia `backend/.env.example` a `backend/.env`
2. Copia `frontend/.env.example` a `frontend/.env`
3. Ejecuta en backend:

```bash
cd backend
npm run seed
```

4. Instala dependencias y arranca para verificar:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

5. Comparte estas credenciales al colaborador:
- Admin: `info@chisteteca.es` / `admin123` (redirige a `/admin`)
- User demo: `sofia@chisteteca.com` / `demo1234` (redirige a `/profile/:id`)

6. Indícale que la documentación válida es solo este `README.md`

## Minimizar peso del proyecto para enviar

El proyecto incluye `node_modules` que ocupa ~60 MB. Para enviar una versión ligera (~4 MB sin dependencias):

### Archivos/carpetas que NO se envían (se regeneran con `npm install`):

```
frontend/node_modules/
backend/node_modules/
frontend/.vite/
backend/uploads/          (carpetas vacías, se crean solas al subir contenido)
backend/-p/               (carpeta vacía sin uso)
backend/qa/results/*.log  (logs temporales)
```

### Comandos para limpiar antes de enviar (Windows):

```bash
# Detener servidores
taskkill /F /IM node.exe

# Eliminar carpetas pesadas
rmdir /s /q frontend\node_modules
rmdir /s /q backend\node_modules
rmdir /s /q backend\uploads
rmdir /s /q backend\-p
rmdir /s /q frontend\.vite
del /q backend\qa\results\*.log
```

### Al recibir el proyecto, el colaborador debe:

```bash
# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# Seed de base de datos
cd backend && npm run seed

# Arrancar en desarrollo
cd backend && npm run dev
# (en otra terminal)
cd frontend && npm run dev
```

## Nota sobre documentación adicional:

La documentación vigente para trabajar y testear el proyecto es este `README.md`.
