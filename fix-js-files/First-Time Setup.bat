@echo off
echo ERP Soul First-Time Setup
echo ==========================
echo.
echo This will thoroughly set up ERP Soul on your computer.
echo It will ensure all dependencies are properly installed.
echo This may take several minutes to complete.
echo.
pause

echo.
echo Starting setup...
echo.

REM Check system requirements first
echo Checking system requirements...
call "%~dp0Check System.bat"
if %errorlevel% neq 0 (
    echo ERROR: System requirements not met. Setup cannot continue.
    pause
    exit /b %errorlevel%
)
echo System requirements are met!
echo.

REM Clean any existing node_modules to ensure fresh installation
echo Cleaning existing node_modules (this may take a moment)...
cd /d "%~dp0"
if exist "node_modules" rmdir /s /q "node_modules" >nul 2>&1
if exist "apps\client\node_modules" rmdir /s /q "apps\client\node_modules" >nul 2>&1
if exist "apps\server\node_modules" rmdir /s /q "apps\server\node_modules" >nul 2>&1
if exist "apps\packages\shared\node_modules" rmdir /s /q "apps\packages\shared\node_modules" >nul 2>&1
echo Cleanup completed!
echo.

REM Clear npm cache to ensure fresh downloads
echo Clearing npm cache...
npm cache clean --force
echo Cache cleared!
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

REM Final npm install at root to link workspaces
echo Linking workspace dependencies...
cd /d "%~dp0"
call npm install
echo Workspace dependencies linked successfully!
echo.

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo You can now run ERP Soul by double-clicking "Launch ERP Soul.bat"
echo.
echo A desktop shortcut has also been created for you.
echo.
pause

REM Create desktop shortcut
call "%~dp0Create Desktop Icon.bat"
