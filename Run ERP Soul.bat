@echo off
echo Starting ERP Soul Application...
cd /d "%~dp0"
echo.
echo Starting server and client...
echo Please wait while the application loads...
echo.

REM Start the server in a new window
start "ERP Soul Server" cmd /k "cd /d "%~dp0apps\server" && npm start"

REM Wait a moment for the server to start
timeout /t 5 /nobreak >nul

REM Open the client in the default browser
start http://localhost:5173

REM Start the client in a new window
start "ERP Soul Client" cmd /k "cd /d "%~dp0apps\client" && npm run dev"

echo.
echo ERP Soul is starting up...
echo - Server is running in a separate window
echo - Client should open in your default browser
echo.
echo To close the application:
echo 1. Close the browser window
echo 2. Close the server and client command windows
echo.
pause
