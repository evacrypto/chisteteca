@echo off
echo ========================================
echo   CHISTETECA - Deteniendo aplicacion
echo ========================================
echo.

REM Detener todos los procesos de Node
echo Deteniendo servidores...
taskkill /F /IM node.exe 2>nul

if %errorlevel% equ 0 (
    echo.
    echo Servidores detenidos correctamente!
) else (
    echo.
    echo No hay servidores en ejecucion.
)

echo.
echo ========================================
pause
