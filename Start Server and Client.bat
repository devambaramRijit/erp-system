@echo off
echo Starting ERP Soul Application (Server and Client)...

REM Start the server in a new window
start "ERP Soul Server" cmd /k "cd /d "%~dp0apps\server" && npm start"

REM Wait a moment for the server to start
timeout /t 3 /nobreak >nul

REM Open the client in the default browser
start http://localhost:5173

REM Start the client in a new window
start "ERP Soul Client" cmd /k "cd /d "%~dp0apps\client" && npm run dev"

echo Both server and client are starting in separate windows.
echo The client should open automatically in your default browser.
echo Close this window to keep both applications running.
pause
