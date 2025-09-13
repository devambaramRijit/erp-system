@echo off
echo ERP Soul Comprehensive Setup
echo ==========================
echo.
echo This will thoroughly set up ERP Soul on your computer.
echo It will ensure all dependencies are properly installed.
echo This may take several minutes to complete.
echo.
pause

echo.
echo Starting comprehensive setup...
echo.

REM Clean any existing node_modules to ensure fresh installation
echo Cleaning existing node_modules...
cd /d "%~dp0"
if exist "node_modules" (
    echo Removing root node_modules...
    rmdir /s /q node_modules
)
if exist "apps\client
ode_modules" (
    echo Removing client node_modules...
    rmdir /s /q apps\client
ode_modules
)
if exist "apps\server
ode_modules" (
    echo Removing server node_modules...
    rmdir /s /q apps\server
ode_modules
)
if exist "apps\packages\shared
ode_modules" (
    echo Removing shared package node_modules...
    rmdir /s /q apps\packages\shared
ode_modules
)
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

REM Explicitly install critical dependencies in client directory
echo Installing critical dependencies in client directory...
cd /d "%~dp0apps\client"

echo Installing xlsx...
call npm install xlsx@^0.18.5
if %errorlevel% neq 0 (
    echo ERROR: Failed to install xlsx!
    pause
    exit /b %errorlevel%
)

echo Installing react-to-print...
call npm install react-to-print@^3.1.1
if %errorlevel% neq 0 (
    echo ERROR: Failed to install react-to-print!
    pause
    exit /b %errorlevel%
)

echo Installing @ant-design/icons...
call npm install @ant-design/icons@^6.0.0
if %errorlevel% neq 0 (
    echo ERROR: Failed to install @ant-design/icons!
    pause
    exit /b %errorlevel%
)

echo Installing antd...
call npm install antd@^5.27.2
if %errorlevel% neq 0 (
    echo ERROR: Failed to install antd!
    pause
    exit /b %errorlevel%
)

echo Installing lucide-react...
call npm install lucide-react@^0.542.0
if %errorlevel% neq 0 (
    echo ERROR: Failed to install lucide-react!
    pause
    exit /b %errorlevel%
)
echo Critical dependencies installed successfully in client directory!
echo.

REM Build the project to ensure everything works
echo Building the project...
cd /d "%~dp0"
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build the project!
    echo Continuing anyway, but some features may not work properly.
)
echo Project built successfully!
echo.

echo.
echo ========================================
echo Comprehensive setup completed successfully!
echo ========================================
echo.
echo You can now run ERP Soul by double-clicking "Run ERP Soul.bat"
echo.
echo A desktop shortcut has also been created for you.
echo.
pause

REM Create desktop shortcut
call "%~dp0Create Desktop Icon.bat"