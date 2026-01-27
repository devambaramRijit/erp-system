@echo off
echo ============================================
echo Flush LocalStorage Data for ErpSoul
echo ============================================
echo.
echo This batch file will clear the following localStorage keys:
echo - simpleInventoryProducts
echo - customers
echo.

choice /C YN /M "Do you want to continue"
if errorlevel 2 exit /b

echo.
echo Clearing localStorage data...
echo.

:: Create a temporary HTML file to clear localStorage
echo ^<!DOCTYPE html^> > %temp%\clearLocalStorage.html
echo ^<html^> >> %temp%\clearLocalStorage.html
echo ^<head^> >> %temp%\clearLocalStorage.html
echo ^<title^>Clear LocalStorage^</title^> >> %temp%\clearLocalStorage.html
echo ^</head^> >> %temp%\clearLocalStorage.html
echo ^<body^> >> %temp%\clearLocalStorage.html
echo ^<script^> >> %temp%\clearLocalStorage.html
echo   localStorage.removeItem('simpleInventoryProducts'); >> %temp%\clearLocalStorage.html
echo   localStorage.removeItem('customers'); >> %temp%\clearLocalStorage.html
echo   alert('LocalStorage data has been cleared!'); >> %temp%\clearLocalStorage.html
echo   window.close(); >> %temp%\clearLocalStorage.html
echo ^</script^> >> %temp%\clearLocalStorage.html
echo ^</body^> >> %temp%\clearLocalStorage.html
echo ^</html^> >> %temp%\clearLocalStorage.html

:: Open the HTML file in the default browser
start "" "%temp%\clearLocalStorage.html"

echo.
echo A browser window has opened to clear the localStorage data.
echo After the alert appears, you can close the browser window.
echo.
echo The temporary file will be automatically deleted.
echo.

:: Wait a moment before cleaning up
timeout /t 3 /nobreak >nul

:: Clean up the temporary file
del "%temp%\clearLocalStorage.html" 2>nul

echo LocalStorage flush process completed!
echo.
pause
