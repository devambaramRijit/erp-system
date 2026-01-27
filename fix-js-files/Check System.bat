@echo off
echo Checking system requirements for ERP Soul...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo Download and run the LTS version, then try again.
    echo.
    pause
    exit /b 1
)

echo Node.js is installed.
node --version
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo.
    echo Please reinstall Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo npm is installed.
npm --version
echo.

echo All requirements are met. You can run ERP Soul!
echo.
echo Double-click "Run ERP Soul.bat" to start the application.
echo.
pause
