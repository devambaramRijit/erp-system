@echo off
echo Hiding Technical Files from View
echo ===============================
echo.
echo This will hide technical files and folders to make the application
echo easier to use for non-technical people.
echo.
echo The files will still be there, just not visible in Windows Explorer.
echo.
pause

REM Hide technical directories
attrib +h "apps" /s /d
attrib +h "packages" /s /d
attrib +h "node_modules" /s /d

REM Hide technical files
attrib +h "package.json"
attrib +h "pnpm-workspace.yaml"
attrib +h "tsconfig.json"
attrib +h ".gitignore"
attrib +h "README.md"
attrib +h "Start Server.bat"
attrib +h "Start Client.bat"
attrib +h "Start Server and Client.bat"
attrib +h "Build App.bat"
attrib +h "Deploy Server.bat"
attrib +h "Start Remote Client.bat"
attrib +h "remote-config.txt"
attrib +h "Create Desktop Icon.bat"
attrib +h "Check System.bat"
attrib +h "First-Time Setup.bat"
attrib +h "package-new.json"
attrib +h "package-backup.json"

echo.
echo All technical files and folders have been hidden!
echo.
echo To show them again, run "Show Technical Files.bat"
echo.
pause
