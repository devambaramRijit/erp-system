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

echo.
echo ====================
echo  Starting ERP Soul...
echo ====================
call npm run dev:sqlite3