@echo off
echo Starting ERP Soul Client...
cd /d "%~dp0apps\client"
start http://localhost:5173
call npm run dev
pause
