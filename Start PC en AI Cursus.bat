@echo off
setlocal
cd /d "%~dp0"
title PC & AI Cursus - Server

if not exist "node_modules" (
  echo Eenmalige installatie van benodigde bestanden, dit duurt even...
  call npm install
  if errorlevel 1 (
    echo.
    echo Er ging iets mis bij het installeren.
    echo Controleer of Node.js is geinstalleerd: https://nodejs.org
    echo.
    pause
    exit /b 1
  )
)

echo.
echo PC en AI Cursus wordt gestart...
echo Laat dit venster openstaan zolang de cursus gebruikt wordt.
echo Sluit dit venster om de server te stoppen.
echo.

start "" cmd /c "timeout /t 3 >nul && start http://localhost:3000"

node server.js

echo.
echo De server is gestopt.
pause
