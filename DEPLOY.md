# ========================================
# GUÍA DE DEPLOY - Chisteteca
# ========================================
# 
# Este documento te guiará para deployar la app en:
# - Backend: Railway (https://railway.app)
# - Frontend: Cloudflare Pages (https://pages.cloudflare.com)
#
# ========================================

## 1. SUBIR CÓDIGO A GITHUB

### Inicializar repo (si no lo has hecho):
```bash
cd c:\chisteteca
git init
git add .
git commit -m "Initial commit - Chisteteca app"
```

### Crear repo en GitHub:
1. Ve a https://github.com/new
2. Nombre del repo: `chisteteca`
3. Público o privado (tu elección)
4. NO marques "Add README" (ya tienes uno)
5. Click en "Create repository"

### Subir código:
```bash
git remote add origin https://github.com/TU-USUARIO/chisteteca.git
git branch -M main
git push -u origin main
```

---

## 2. DEPLOY BACKEND EN RAILWAY

### Pasos en Railway:
1. Ve a https://railway.app y crea una cuenta (usa GitHub login)
2. Click en **"New Project"** → **"Deploy from GitHub repo"**
3. Conecta tu cuenta de GitHub y selecciona `chisteteca`
4. Railway detectará el repo. Configura el servicio:

| Campo | Valor |
|-------|-------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

5. Ve a **Settings** → **Networking** → **Generate Domain** para obtener la URL pública
6. En **Variables**, añade las **Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | *(tu URI de MongoDB Atlas)* |
| `JWT_SECRET` | `tu_clave_secreta_muy_larga_y_segura_12345` |
| `FRONTEND_URL` | `https://chisteteca-frontend.pages.dev` |
| `MAX_IMAGE_SIZE` | `5242880` |
| `MAX_VIDEO_SIZE` | `52428800` |
| `MAX_VIDEO_DURATION` | `120` |

7. Copia la URL de tu backend (ej: `https://chisteteca-backend-production-xxxx.up.railway.app`)

### MongoDB Atlas (si no tienes):
1. Ve a https://cloud.mongodb.com
2. Crea cuenta gratuita
3. Crea un cluster gratuito (M0)
4. Crea usuario de base de datos
5. En "Network Access", añade `0.0.0.0/0` (allow all)
6. Obtén el connection string
7. Reemplaza `<password>` con tu contraseña
8. Pégalo en `MONGODB_URI` en Railway

Formato del connection string:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/chisteteca?retryWrites=true&w=majority
```

---

## 3. DEPLOY FRONTEND EN CLOUDFLARE PAGES

### Pasos en Cloudflare Pages:
1. Ve a https://pages.cloudflare.com
2. Inicia sesión (usa GitHub login)
3. Click en **"Create a project"** → **"Connect to Git"**
4. Selecciona `chisteteca`
5. Configura el proyecto:

| Campo | Valor |
|-------|-------|
| **Project name** | `chisteteca-frontend` |
| **Production branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Build output directory** | `dist` |

6. Click en **"Environment variables (advanced)"** y añade:

| Variable name | Value |
|---------------|-------|
| `VITE_API_URL` | `https://TU-URL-RAILWAY.up.railway.app/api` |
| `VITE_FRONTEND_URL` | `https://chisteteca-frontend.pages.dev` |
| `VITE_CANONICAL_URL` | `https://chisteteca.es` (o tu dominio custom; evita que salga Railway en enlaces compartidos) |

7. Click en **"Save and Deploy"**

8. Espera a que el build termine (~1-3 minutos)

---

## 4. ACTUALIZAR CORS EN EL BACKEND

Una vez tengas la URL final de Cloudflare:

1. Ve a Railway → Tu servicio → **Variables**
2. Edita `FRONTEND_URL`:
   - Cambia a: `https://chisteteca-frontend.pages.dev` (o tu dominio custom)
3. El servicio se redeployará automáticamente

---

## 5. VERIFICAR DEPLOY

### Backend:
- Abre: `https://TU-URL-RAILWAY.up.railway.app/api/health`
- Deberías ver: `{"status": "OK", "message": "Chisteteca API is running"}`

### Frontend:
- Abre: `https://chisteteca-frontend.pages.dev`
- Prueba el login con: `admin@chisteteca.es` / `admin123`

---

## 6. VARIABLES DE ENTORNO RESUMEN

### Railway (Backend):
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=cambia_esto_por_algo_seguro
FRONTEND_URL=https://chisteteca-frontend.pages.dev
BACKEND_URL=https://tu-backend.up.railway.app
RESEND_NEWSLETTER_SEGMENT_ID=xxx
MAX_IMAGE_SIZE=5242880
MAX_VIDEO_SIZE=52428800
MAX_VIDEO_DURATION=120
```

### Cloudflare Pages (Frontend):
```
VITE_API_URL=https://TU-URL-RAILWAY.up.railway.app/api
VITE_FRONTEND_URL=https://chisteteca-frontend.pages.dev
VITE_CANONICAL_URL=https://chisteteca.es
```

---

## 7. NEWSLETTER (OPCIONAL)

1. En Resend Dashboard → **Audiences** (o Segments) → crear segmento "Chisteteca Newsletter"
2. Copiar el ID del segmento y añadir en Railway: `RESEND_NEWSLETTER_SEGMENT_ID=xxx`
3. Añadir `BACKEND_URL=https://tu-backend.up.railway.app` en Railway (para enlaces de confirmación)
4. Los suscriptores se confirman por email (double opt-in) y se añaden al segmento
5. En Admin → Resumen → "Enviar digest semanal" para enviar el boletín de chistes

---

## 8. DEPLOYS FUTUROS

Cada vez que hagas push a `main`:
- **Railway** redeployará automáticamente el backend
- **Cloudflare Pages** redeployará automáticamente el frontend

Para deployar cambios:
```bash
git add .
git commit -m "Descripción de cambios"
git push
```

---

## 9. SOLUCIÓN DE PROBLEMAS

### Backend no arranca en Railway:
- Revisa los logs en Railway → Deployments → View Logs
- Verifica que `MONGODB_URI` sea correcta
- Asegúrate de que MongoDB Atlas permita conexiones desde cualquier IP

### Frontend no conecta con API:
- Verifica `VITE_API_URL` en Cloudflare Pages
- Revisa la consola del navegador (F12) para errores CORS
- Asegúrate de que `FRONTEND_URL` en Railway sea la URL de Cloudflare

### Error 404 en frontend:
- Verifica que el build output directory sea `dist`
- Revisa los logs de build en Cloudflare Pages

### MongoDB no conecta:
- En Atlas, verifica "Network Access" → `0.0.0.0/0`
- Verifica que el usuario/contraseña sean correctos
- Asegúrate de que la base de datos `chisteteca` exista

---

## 9. URLs FINALES

- **Frontend:** https://chisteteca-frontend.pages.dev
- **Backend API:** https://TU-URL-RAILWAY.up.railway.app
- **Health Check:** https://TU-URL-RAILWAY.up.railway.app/api/health

---

## 10. COMANDOS ÚTILES

```bash
# Ver estado del repo
git status

# Ver cambios
git diff

# Subir cambios
git add .
git commit -m "mensaje"
git push

# Ver logs locales
cd backend && npm run dev
cd frontend && npm run dev
```

---

¡Listo! Tu app debería estar online y funcionando. Railway no tiene spin-down como Render, así que la API responde rápido incluso tras periodos de inactividad.
