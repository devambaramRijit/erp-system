@echo off
title ERP Soul Launcher

echo =================================
echo  Welcome to ERP Soul Launcher
echo =================================
echo.

REM Check if setup has been run by looking for key node_modules folders.
echo Checking if setup is required...
if not exist "apps\client\node_modules" (
    echo.
    echo First-time setup not detected or dependencies are missing.
    echo Running the setup process now. This may take several minutes...
    echo.
    call "%~dp0First-Time Setup.bat"
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Setup failed. The application cannot start.
        pause
        exit /b %errorlevel%
    )
    echo.
    echo Setup completed successfully!
) else (
    echo Dependencies found. Proceeding to launch.
)

REM Ensure root dependencies are installed
echo.
echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install root dependencies.
    pause
    exit /b %errorlevel%
)
echo Root dependencies installed successfully!

echo.
echo ====================
echo  Starting ERP Soul...
echo ====================
echo.
echo The application will be available at http://localhost:3000
echo Please wait for the server to start...
echo.
echo Press Ctrl+C to stop the server
echo.
call npx concurrently "npm run dev:sqlite3-server" "npm run dev --workspace=apps/client"

echo.
echo ERP Soul has been stopped.
pause