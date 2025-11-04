@echo off
echo ========================================
echo Starting ErpSoul Application
echo ========================================

echo.
echo [1/3] Changing to server directory...
cd /d "%~dp0apps\server"

echo.
echo [2/3] Starting server on port 3000...
start "ErpSoul Server" cmd /k npm start

echo.
echo [3/3] Changing to client directory and starting client...
cd /d "%~dp0apps\client"
start "ErpSoul Client" cmd /k npm run dev

echo.
echo ========================================
echo Both server and client are starting...
echo - Server will run on http://localhost:3000
echo - Client will run on http://localhost:5173
echo ========================================
echo.
echo Press any key to close this window...
pause > nul
