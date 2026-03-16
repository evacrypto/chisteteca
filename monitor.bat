@echo off
echo ========================================
echo   CHISTETECA - Monitor de Servidores
echo ========================================
echo.
echo Monitoreando servidores...
echo Presiona Ctrl+C para detener
echo.

:loop
  curl -s http://localhost:5000/api/health >nul 2>&1
  if %errorlevel% equ 0 (
    echo [%time%] Backend: OK
  ) else (
    echo [%time%] Backend: FALLIDO - Intentando reiniciar...
    start "" cmd /k "cd /d %~dp0backend && npm run dev"
    timeout /t 5 /nobreak >nul
  )
  
  curl -s http://localhost:3000 >nul 2>&1
  if %errorlevel% equ 0 (
    echo [%time%] Frontend: OK
  ) else (
    echo [%time%] Frontend: FALLIDO - Intentando reiniciar...
    start "" cmd /k "cd /d %~dp0frontend && npm run dev"
    timeout /t 5 /nobreak >nul
  )
  
  timeout /t 10 /nobreak >nul
  goto loop
