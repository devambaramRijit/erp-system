@echo off
echo Starting ERP Soul Server...
cd /d "%~dp0apps\server"
call npm start
pause
