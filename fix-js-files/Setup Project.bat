@echo off
echo ERP Soul First-Time Setup
echo ========================
echo.
echo This will set up ERP Soul on your computer.
echo It may take a few minutes to complete.
echo.
pause

echo.
echo Installing dependencies...
echo.

REM Install root dependencies
echo Installing root dependencies...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies!
    pause
    exit /b %errorlevel%
)
echo Root dependencies installed successfully!
echo.

REM Install server dependencies
echo Installing server dependencies...
cd /d "%~dp0apps\server"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install server dependencies!
    pause
    exit /b %errorlevel%
)
echo Server dependencies installed successfully!
echo.

REM Install client dependencies
echo Installing client dependencies...
cd /d "%~dp0apps\client"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install client dependencies!
    pause
    exit /b %errorlevel%
)
echo Client dependencies installed successfully!
echo.

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo You can now run ERP Soul by double-clicking "Run ERP Soul.bat"
echo.
echo A desktop shortcut has also been created for you.
echo.
pause

REM Create desktop shortcut
call "%~dp0Create Desktop Icon.bat"
