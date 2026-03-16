@echo off
echo ========================================
echo   CHISTETECA - Iniciando aplicacion
echo ========================================
echo.

REM Abrir terminal para Backend
echo [1/2] Iniciando Backend...
start "Chisteteca - Backend" cmd /k "cd /d %~dp0backend && npm run dev"

REM Esperar 2 segundos
timeout /t 2 /nobreak >nul

REM Abrir terminal para Frontend
echo [2/2] Iniciando Frontend...
start "Chisteteca - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Servidores iniciados!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Presiona cualquier tecla para salir de esta ventana...
pause >nul
