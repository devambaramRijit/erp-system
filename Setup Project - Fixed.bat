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

REM Install shared package dependencies if it exists
if exist "%~dp0apps\packages\shared" (
    echo Installing shared package dependencies...
    cd /d "%~dp0apps\packages\shared"
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install shared package dependencies!
        pause
        exit /b %errorlevel%
    )
    echo Shared package dependencies installed successfully!
    echo.
)

REM Link workspace dependencies to ensure they're available
echo Linking workspace dependencies...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to link workspace dependencies!
    pause
    exit /b %errorlevel%
)
echo Workspace dependencies linked successfully!
echo.

REM Ensure xlsx is available in the client directory
echo Ensuring xlsx is available in client directory...
cd /d "%~dp0apps\client"
call npm install xlsx@^0.18.5
if %errorlevel% neq 0 (
    echo ERROR: Failed to install xlsx in client directory!
    pause
    exit /b %errorlevel%
)
echo xlsx installed successfully in client directory!
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