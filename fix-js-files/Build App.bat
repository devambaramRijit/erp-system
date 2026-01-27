@echo off
echo Building ERP Soul Application...
echo This will build the client and server components...

REM Step 1: Build the React app
echo Building React app...
cd /d "%~dp0apps\client"
call npm run build
if %errorlevel% neq 0 (
    echo Error: Failed to build React app
    pause
    exit /b %errorlevel%
)
echo React app built successfully.

REM Step 2: Install server dependencies
echo Installing server dependencies...
cd /d "%~dp0apps\server"
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install server dependencies
    pause
    exit /b %errorlevel%
)
echo Server dependencies installed.

echo Build process completed successfully!
pause
