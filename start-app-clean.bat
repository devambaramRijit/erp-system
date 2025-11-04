@echo off
echo ========================================
echo Starting ErpSoul Application (Clean Start)
echo ========================================

echo.
echo [1/4] Checking for processes using port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Found process %%a using port 3000. Terminating...
    taskkill /F /PID %%a
    echo Process terminated.
)

echo.
echo [2/4] Checking for processes using port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Found process %%a using port 5173. Terminating...
    taskkill /F /PID %%a
    echo Process terminated.
)

echo.
echo [3/4] Changing to server directory...
cd /d "%~dp0apps\server"

echo.
echo Starting server on port 3000...
start "ErpSoul Server" cmd /k npm start

echo.
echo [4/4] Changing to client directory and starting client...
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
