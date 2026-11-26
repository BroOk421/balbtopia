@echo off
rem Balbtopia realtime server: double-click to start. Close this window (or press Ctrl+C) to stop.
cd /d "%~dp0"
if not exist node_modules (
  echo Installing for the first time...
  call npm install
)
:again
node server.js
echo.
echo The server stopped. Starting again in 5 seconds (close this window to stop for good)...
timeout /t 5 >nul
goto again
