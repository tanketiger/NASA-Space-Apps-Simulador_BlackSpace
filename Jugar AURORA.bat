@echo off
setlocal
title AURORA - Outpost on Mars
cd /d "%~dp0"

echo ============================================
echo   AURORA - Outpost on Mars
echo ============================================
echo.

REM --- 1) Is Node installed? ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install it from https://nodejs.org  ^(LTS version^) and run this file again.
  echo.
  pause
  exit /b 1
)

REM --- 2) Are dependencies installed? ---
if not exist "node_modules" (
  echo [1/3] Installing dependencies for the first time ^(this may take a few minutes^)...
  call npm install
  if errorlevel 1 (
    echo [ERROR] "npm install" failed.
    pause
    exit /b 1
  )
) else (
  echo [1/3] Dependencies OK.
)

REM --- 3) Build if the build folder is missing ---
REM  A separate folder ^(.next-aurora2^) is used because OneDrive breaks the normal build.
set "NEXT_DIST_DIR=.next-aurora2"
if not exist "%NEXT_DIST_DIR%" (
  echo [2/3] Building the game for the first time ^(this may take 1-2 minutes^)...
  call npm run build
  if errorlevel 1 (
    echo.
    echo [ERROR] The build failed. Close any other game window and try again.
    pause
    exit /b 1
  )
) else (
  echo [2/3] Game already built.
)

REM --- 4) Start the server + open the browser ---
echo [3/3] Starting the game at http://localhost:3219 ...
echo.
echo   (To close the game: close this window or press Ctrl + C)
echo.

start "" "http://localhost:3219"
call npm run start -- -p 3219

echo.
echo The game has stopped.
pause
