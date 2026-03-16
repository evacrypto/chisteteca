# ========================================
# GUÍA DE DEPLOY - Chisteteca
# ========================================
# 
# Este documento te guiará para deployar la app en:
# - Backend: Render (https://render.com)
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

## 2. DEPLOY BACKEND EN RENDER

### Pasos en Render:
1. Ve a https://render.com y crea una cuenta (usa GitHub login)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu cuenta de GitHub
4. Busca y selecciona `chisteteca`
5. Configura el servicio:

| Campo | Valor |
|-------|-------|
| **Name** | `chisteteca-backend` |
| **Region** | `Frankfurt, Germany` (más cercano a España) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

6. Click en **"Advanced"** y añade las **Environment Variables**:

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

7. Click en **"Create Web Service"**

### MongoDB Atlas (si no tienes):
1. Ve a https://cloud.mongodb.com
2. Crea cuenta gratuita
3. Crea un cluster gratuito (M0)
4. Crea usuario de base de datos
5. En "Network Access", añade `0.0.0.0/0` (allow all)
6. Obtén el connection string
7. Reemplaza `<password>` con tu contraseña
8. Pégalo en `MONGODB_URI` en Render

Formato del connection string:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/chisteteca?retryWrites=true&w=majority
```

8. Espera a que el deploy termine (~2-5 minutos)
9. Copia la URL de tu backend: `https://chisteteca-backend.onrender.com`

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
| `VITE_API_URL` | `https://chisteteca-backend.onrender.com/api` |
| `VITE_FRONTEND_URL` | `https://chisteteca-frontend.pages.dev` |

7. Click en **"Save and Deploy"**

8. Espera a que el build termine (~1-3 minutos)

---

## 4. ACTUALIZAR CORS EN EL BACKEND

Una vez tengas la URL final de Cloudflare:

1. Ve a Render → Tu servicio → **Environment**
2. Edita `FRONTEND_URL`:
   - Cambia a: `https://chisteteca-frontend.pages.dev`
3. Click en **"Save Changes"**
4. El servicio se redeployará automáticamente

---

## 5. VERIFICAR DEPLOY

### Backend:
- Abre: `https://chisteteca-backend.onrender.com/api/health`
- Deberías ver: `{"status": "OK", "message": "Chisteteca API is running"}`

### Frontend:
- Abre: `https://chisteteca-frontend.pages.dev`
- Prueba el login con: `admin@chisteteca.com` / `admin123`

---

## 6. VARIABLES DE ENTORNO RESUMEN

### Render (Backend):
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=cambia_esto_por_algo_seguro
FRONTEND_URL=https://chisteteca-frontend.pages.dev
MAX_IMAGE_SIZE=5242880
MAX_VIDEO_SIZE=52428800
MAX_VIDEO_DURATION=120
```

### Cloudflare Pages (Frontend):
```
VITE_API_URL=https://chisteteca-backend.onrender.com/api
VITE_FRONTEND_URL=https://chisteteca-frontend.pages.dev
```

---

## 7. DEPLOYS FUTUROS

Cada vez que hagas push a `main`:
- **Render** redeployará automáticamente el backend
- **Cloudflare Pages** redeployará automáticamente el frontend

Para deployar cambios:
```bash
git add .
git commit -m "Descripción de cambios"
git push
```

---

## 8. SOLUCIÓN DE PROBLEMAS

### Backend no arranca en Render:
- Revisa los logs en Render → Logs
- Verifica que `MONGODB_URI` sea correcta
- Asegúrate de que MongoDB Atlas permita conexiones desde cualquier IP

### Frontend no conecta con API:
- Verifica `VITE_API_URL` en Cloudflare Pages
- Revisa la consola del navegador (F12) para errores CORS
- Asegúrate de que `FRONTEND_URL` en Render sea la URL de Cloudflare

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
- **Backend API:** https://chisteteca-backend.onrender.com
- **Health Check:** https://chisteteca-backend.onrender.com/api/health

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

¡Listo! Tu app debería estar online y funcionando.
