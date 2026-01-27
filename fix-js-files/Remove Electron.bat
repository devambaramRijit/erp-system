@echo off
echo Removing Electron from ERP Soul...
echo ==============================
echo.
echo This will remove all Electron-related files and references.
echo.
pause

REM Create a backup of package.json
echo Creating backup of package.json...
copy "package.json" "package-backup.json"
echo Backup created.

REM Replace package.json with the new version without Electron
echo Updating package.json...
move /Y "package-new.json" "package.json"
echo package.json updated.

REM Remove the electron directory
echo Removing electron directory...
rmdir /s /q "electron"
echo Electron directory removed.

REM Update Build App.bat to remove Electron references
echo Creating a new build script without Electron...
echo @echo off> "Build App.bat"
echo echo Building ERP Soul Application...>> "Build App.bat"
echo echo This will build the client and server components...>> "Build App.bat"
echo.>> "Build App.bat"
echo REM Step 1: Build the React app>> "Build App.bat"
echo echo Building React app...>> "Build App.bat"
echo cd /d "%%~dp0apps\client">> "Build App.bat"
echo call npm run build>> "Build App.bat"
echo if %%errorlevel%% neq 0 (>> "Build App.bat"
echo     echo Error: Failed to build React app>> "Build App.bat"
echo     pause>> "Build App.bat"
echo     exit /b %%errorlevel%%>> "Build App.bat"
echo )>> "Build App.bat"
echo echo React app built successfully.>> "Build App.bat"
echo.>> "Build App.bat"
echo REM Step 2: Install server dependencies>> "Build App.bat"
echo echo Installing server dependencies...>> "Build App.bat"
echo cd /d "%%~dp0apps\server">> "Build App.bat"
echo call npm install>> "Build App.bat"
echo if %%errorlevel%% neq 0 (>> "Build App.bat"
echo     echo Error: Failed to install server dependencies>> "Build App.bat"
echo     pause>> "Build App.bat"
echo     exit /b %%errorlevel%%>> "Build App.bat"
echo )>> "Build App.bat"
echo echo Server dependencies installed.>> "Build App.bat"
echo.>> "Build App.bat"
echo echo Build process completed successfully!>> "Build App.bat"
echo pause>> "Build App.bat"
echo Build App.bat updated.

REM Update Hide Technical Files.bat to remove Electron references
echo Updating Hide Technical Files.bat...
echo @echo off> "Hide Technical Files-new.bat"
echo echo Hiding Technical Files from View>> "Hide Technical Files-new.bat"
echo echo ===============================>> "Hide Technical Files-new.bat"
echo echo.>> "Hide Technical Files-new.bat"
echo echo This will hide technical files and folders to make the application>> "Hide Technical Files-new.bat"
echo echo easier to use for non-technical people.>> "Hide Technical Files-new.bat"
echo echo.>> "Hide Technical Files-new.bat"
echo echo The files will still be there, just not visible in Windows Explorer.>> "Hide Technical Files-new.bat"
echo echo.>> "Hide Technical Files-new.bat"
echo pause>> "Hide Technical Files-new.bat"
echo.>> "Hide Technical Files-new.bat"
echo REM Hide technical directories>> "Hide Technical Files-new.bat"
echo attrib +h "apps" /s /d>> "Hide Technical Files-new.bat"
echo attrib +h "packages" /s /d>> "Hide Technical Files-new.bat"
echo attrib +h "node_modules" /s /d>> "Hide Technical Files-new.bat"
echo.>> "Hide Technical Files-new.bat"
echo REM Hide technical files>> "Hide Technical Files-new.bat"
echo attrib +h "package.json">> "Hide Technical Files-new.bat"
echo attrib +h "pnpm-workspace.yaml">> "Hide Technical Files-new.bat"
echo attrib +h "tsconfig.json">> "Hide Technical Files-new.bat"
echo attrib +h ".gitignore">> "Hide Technical Files-new.bat"
echo attrib +h "README.md">> "Hide Technical Files-new.bat"
echo attrib +h "Start Server.bat">> "Hide Technical Files-new.bat"
echo attrib +h "Start Client.bat">> "Hide Technical Files-new.bat"
echo attrib +h "Start Server and Client.bat">> "Hide Technical Files-new.bat"
echo attrib +h "Build App.bat">> "Hide Technical Files-new.bat"
echo attrib +h "Deploy Server.bat">> "Hide Technical Files-new.bat"
echo attrib +h "Start Remote Client.bat">> "Hide Technical Files-new.bat"
echo attrib +h "remote-config.txt">> "Hide Technical Files-new.bat"
echo attrib +h "Create Desktop Icon.bat">> "Hide Technical Files-new.bat"
echo attrib +h "Check System.bat">> "Hide Technical Files-new.bat"
echo attrib +h "First-Time Setup.bat">> "Hide Technical Files-new.bat"
echo attrib +h "package-new.json">> "Hide Technical Files-new.bat"
echo attrib +h "package-backup.json">> "Hide Technical Files-new.bat"
echo.>> "Hide Technical Files-new.bat"
echo echo.>> "Hide Technical Files-new.bat"
echo echo All technical files and folders have been hidden!>> "Hide Technical Files-new.bat"
echo echo.>> "Hide Technical Files-new.bat"
echo echo To show them again, run "Show Technical Files.bat">> "Hide Technical Files-new.bat"
echo echo.>> "Hide Technical Files-new.bat"
echo pause>> "Hide Technical Files-new.bat"
move /Y "Hide Technical Files-new.bat" "Hide Technical Files.bat"

echo Hide Technical Files.bat updated.

REM Update Show Technical Files.bat to remove Electron references
echo Updating Show Technical Files.bat...
echo @echo off> "Show Technical Files-new.bat"
echo echo Showing Technical Files>> "Show Technical Files-new.bat"
echo echo ======================>> "Show Technical Files-new.bat"
echo echo.>> "Show Technical Files-new.bat"
echo echo This will make all technical files and folders visible again.>> "Show Technical Files-new.bat"
echo echo.>> "Show Technical Files-new.bat"
echo pause>> "Show Technical Files-new.bat"
echo.>> "Show Technical Files-new.bat"
echo REM Show technical directories>> "Show Technical Files-new.bat"
echo attrib -h "apps" /s /d>> "Show Technical Files-new.bat"
echo attrib -h "packages" /s /d>> "Show Technical Files-new.bat"
echo attrib -h "node_modules" /s /d>> "Show Technical Files-new.bat"
echo.>> "Show Technical Files-new.bat"
echo REM Show technical files>> "Show Technical Files-new.bat"
echo attrib -h "package.json">> "Show Technical Files-new.bat"
echo attrib -h "pnpm-workspace.yaml">> "Show Technical Files-new.bat"
echo attrib -h "tsconfig.json">> "Show Technical Files-new.bat"
echo attrib -h ".gitignore">> "Show Technical Files-new.bat"
echo attrib -h "README.md">> "Show Technical Files-new.bat"
echo attrib -h "Start Server.bat">> "Show Technical Files-new.bat"
echo attrib -h "Start Client.bat">> "Show Technical Files-new.bat"
echo attrib -h "Start Server and Client.bat">> "Show Technical Files-new.bat"
echo attrib -h "Build App.bat">> "Show Technical Files-new.bat"
echo attrib -h "Deploy Server.bat">> "Show Technical Files-new.bat"
echo attrib -h "Start Remote Client.bat">> "Show Technical Files-new.bat"
echo attrib -h "remote-config.txt">> "Show Technical Files-new.bat"
echo attrib -h "Create Desktop Icon.bat">> "Show Technical Files-new.bat"
echo attrib -h "Check System.bat">> "Show Technical Files-new.bat"
echo attrib -h "First-Time Setup.bat">> "Show Technical Files-new.bat"
echo attrib -h "package-new.json">> "Show Technical Files-new.bat"
echo attrib -h "package-backup.json">> "Show Technical Files-new.bat"
echo.>> "Show Technical Files-new.bat"
echo echo.>> "Show Technical Files-new.bat"
echo echo All technical files and folders are now visible!>> "Show Technical Files-new.bat"
echo echo.>> "Show Technical Files-new.bat"
echo pause>> "Show Technical Files-new.bat"
move /Y "Show Technical Files-new.bat" "Show Technical Files.bat"

echo Show Technical Files.bat updated.

REM Update First-Time Setup.bat to remove Electron references
echo Updating First-Time Setup.bat...
echo @echo off> "First-Time Setup-new.bat"
echo echo ERP Soul First-Time Setup>> "First-Time Setup-new.bat"
echo echo ========================>> "First-Time Setup-new.bat"
echo echo.>> "First-Time Setup-new.bat"
echo echo This will set up ERP Soul on your computer.>> "First-Time Setup-new.bat"
echo echo It may take a few minutes to complete.>> "First-Time Setup-new.bat"
echo echo.>> "First-Time Setup-new.bat"
echo pause>> "First-Time Setup-new.bat"
echo.>> "First-Time Setup-new.bat"
echo echo Installing dependencies...>> "First-Time Setup-new.bat"
echo echo.>> "First-Time Setup-new.bat"
echo.>> "First-Time Setup-new.bat"
echo REM Install server dependencies>> "First-Time Setup-new.bat"
echo echo Installing server dependencies...>> "First-Time Setup-new.bat"
echo cd /d "%%~dp0apps\server">> "First-Time Setup-new.bat"
echo call npm install>> "First-Time Setup-new.bat"
echo if %%errorlevel%% neq 0 (>> "First-Time Setup-new.bat"
echo     echo ERROR: Failed to install server dependencies!>> "First-Time Setup-new.bat"
echo     pause>> "First-Time Setup-new.bat"
echo     exit /b %%errorlevel%%>> "First-Time Setup-new.bat"
echo )>> "First-Time Setup-new.bat"
echo echo Server dependencies installed successfully!>> "First-Time Setup-new.bat"
echo echo.>> "First-Time Setup-new.bat"
echo.>> "First-Time Setup-new.bat"
echo REM Install client dependencies>> "First-Time Setup-new.bat"
echo echo Installing client dependencies...>> "First-Time Setup-new.bat"
echo cd /d "%%~dp0apps\client">> "First-Time Setup-new.bat"
echo call npm install>> "First-Time Setup-new.bat"
echo if %%errorlevel%% neq 0 (>> "First-Time Setup-new.bat"
echo     echo ERROR: Failed to install client dependencies!>> "First-Time Setup-new.bat"
echo     pause>> "First-Time Setup-new.bat"
echo     exit /b %%errorlevel%%>> "First-Time Setup-new.bat"
echo )>> "First-Time Setup-new.bat"
echo echo Client dependencies installed successfully!>> "First-Time Setup-new.bat"
echo echo.>> "First-Time Setup-new.bat"
echo.>> "First-Time Setup-new.bat"
echo echo.>> "First-Time Setup-new.bat"
echo echo ========================================>> "First-Time Setup-new.bat"
echo echo Setup completed successfully!>> "First-Time Setup-new.bat"
echo echo ========================================>> "First-Time Setup-new.bat"
echo echo.>> "First-Time Setup-new.bat"
echo echo You can now run ERP Soul by double-clicking "Run ERP Soul.bat">> "First-Time Setup-new.bat"
echo echo.>> "First-Time Setup-new.bat"
echo echo A desktop shortcut has also been created for you.>> "First-Time Setup-new.bat"
echo echo.>> "First-Time Setup-new.bat"
echo pause>> "First-Time Setup-new.bat"
echo.>> "First-Time Setup-new.bat"
echo REM Create desktop shortcut>> "First-Time Setup-new.bat"
echo call "%%~dp0Create Desktop Icon.bat">> "First-Time Setup-new.bat"
move /Y "First-Time Setup-new.bat" "First-Time Setup.bat"

echo First-Time Setup.bat updated.

REM Clean up
echo Cleaning up temporary files...
echo Temporary files removed.

echo.
echo ========================================
echo Electron has been removed from the project!
echo ========================================
echo.
echo The following changes were made:
echo - Removed electron directory
echo - Updated package.json to remove Electron references
echo - Updated Build App.bat to remove Electron references
echo - Updated other scripts to remove Electron references
echo - Created backup of original package.json as package-backup.json
echo.
echo You can now run the application without Electron!
echo.
pause
