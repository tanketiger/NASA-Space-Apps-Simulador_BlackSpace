@echo off
setlocal
title AURORA - Puesto Avanzado en Marte
cd /d "%~dp0"

echo ============================================
echo   AURORA - Puesto Avanzado en Marte
echo ============================================
echo.

REM --- 1) Node instalado? ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro Node.js.
  echo Instalalo desde https://nodejs.org  ^(version LTS^) y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

REM --- 2) Dependencias instaladas? ---
if not exist "node_modules" (
  echo [1/3] Instalando dependencias por primera vez ^(puede tardar unos minutos^)...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Fallo "npm install".
    pause
    exit /b 1
  )
) else (
  echo [1/3] Dependencias OK.
)

REM --- 3) Compilar si no existe el build ---
REM  Se usa una carpeta aparte ^(.next-aurora2^) porque OneDrive rompe el build normal.
set "NEXT_DIST_DIR=.next-aurora2"
if not exist "%NEXT_DIST_DIR%" (
  echo [2/3] Compilando el juego por primera vez ^(puede tardar 1-2 minutos^)...
  call npm run build
  if errorlevel 1 (
    echo.
    echo [ERROR] Fallo la compilacion. Cierra cualquier otra ventana del juego y reintenta.
    pause
    exit /b 1
  )
) else (
  echo [2/3] Juego ya compilado.
)

REM --- 4) Arrancar servidor + abrir navegador ---
echo [3/3] Iniciando el juego en http://localhost:3219 ...
echo.
echo   (Para cerrar el juego: cierra esta ventana o pulsa Ctrl + C)
echo.

start "" "http://localhost:3219"
call npm run start -- -p 3219

echo.
echo El juego se ha detenido.
pause
