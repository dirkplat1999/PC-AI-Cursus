@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title PC ^& AI Cursus - Server

set "RESULT_FILE=%TEMP%\pcai-node-bin.txt"
if exist "%RESULT_FILE%" del "%RESULT_FILE%" >nul 2>&1

echo Node.js wordt gecontroleerd...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-node.ps1" -ResultFile "%RESULT_FILE%"
if errorlevel 1 (
  echo.
  echo Kon Node.js niet automatisch downloaden ^(bijvoorbeeld door geen internetverbinding^).
  echo Installeer Node.js handmatig via https://nodejs.org en start dit bestand daarna opnieuw.
  echo.
  pause
  exit /b 1
)

if not exist "%RESULT_FILE%" (
  echo.
  echo Er ging iets onverwachts mis bij het voorbereiden van Node.js.
  echo.
  pause
  exit /b 1
)

set /p NODE_BIN=<"%RESULT_FILE%"
del "%RESULT_FILE%" >nul 2>&1
set "PATH=%NODE_BIN%;%PATH%"

if not exist "node_modules\express\package.json" (
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
