@echo off
echo Creating desktop shortcut...
echo.

REM Check if the target file exists
if not exist "%~dp0Run ERP Soul.bat" (
    echo ERROR: Run ERP Soul.bat not found in the current directory!
    echo Make sure you are running this script from the ERP Soul folder.
    echo.
    pause
    exit /b 1
)

REM Get the desktop path
for /f "tokens=2,*" %%a in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" /v "Desktop"') do set DESKTOP=%%b

if not defined DESKTOP (
    echo ERROR: Could not find desktop path!
    echo.
    pause
    exit /b 1
)

REM Create the VBScript to create the shortcut
set SHORTCUT=%DESKTOP%\ERP Soul.lnk
set SCRIPT="%TEMP%\create_shortcut.vbs"

echo Set objShell = CreateObject("WScript.Shell") > %SCRIPT%
echo Set objShortcut = objShell.CreateShortcut("%SHORTCUT%") >> %SCRIPT%
echo objShortcut.TargetPath = "%~dp0Run ERP Soul.bat" >> %SCRIPT%
echo objShortcut.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo objShortcut.IconLocation = "%SystemRoot%\System32\shell32.dll,14" >> %SCRIPT%
echo objShortcut.Save >> %SCRIPT%

REM Execute the VBScript
echo Creating shortcut at: "%SHORTCUT%"
cscript //nologo %SCRIPT%

REM Check if the shortcut was created
if exist "%SHORTCUT%" (
    echo.
    echo SUCCESS: Desktop shortcut created successfully!
    echo You can now run ERP Soul from your desktop.
) else (
    echo.
    echo ERROR: Failed to create the desktop shortcut.
    echo You may need to run this script as administrator.
)

REM Clean up
del %SCRIPT% >nul 2>&1

echo.
pause
