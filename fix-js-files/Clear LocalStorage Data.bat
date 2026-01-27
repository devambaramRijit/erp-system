@echo off
echo ============================================
echo Clear LocalStorage Data for ErpSoul
echo ============================================
echo.
echo This batch file will clear all data from:
echo - localStorage inventory data (products)
echo - localStorage customer data
echo.
echo This will clear data only in your browser's localStorage.
echo.

choice /C YN /M "Do you want to continue"
if errorlevel 2 exit /b

echo.
echo Creating a script to clear localStorage...
echo.

:: Create a temporary HTML file to clear localStorage
set TEMP_HTML=%TEMP%\clearLocalStorage.html
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo   ^<title^>Clear LocalStorage^</title^>
echo ^</head^>
echo ^<body^>
echo   ^<h1^>Clearing LocalStorage Data...^</h1^>
echo   ^<div id="status"^>Processing...^</div^>
echo   ^<script^>
echo     // Function to clear ALL localStorage keys
echo     function clearLocalStorage() {
echo       // Get all localStorage keys
echo       const keys = Object.keys(localStorage);
echo       let clearedCount = 0;
echo       const statusDiv = document.getElementById('status');
echo       
echo       console.log('Found localStorage keys:', keys);
echo       
echo       // Clear all keys
       keys.forEach(key => {
echo         localStorage.removeItem(key);
echo         clearedCount++;
echo         console.log('Cleared localStorage key:', key);
echo       });
echo       
echo       // Clear sessionStorage as well
echo       const sessionKeys = Object.keys(sessionStorage);
echo       console.log('Found sessionStorage keys:', sessionKeys);
echo       
echo       sessionKeys.forEach(key => {
echo         sessionStorage.removeItem(key);
echo         console.log('Cleared sessionStorage key:', key);
echo         clearedCount++;
echo       });
echo       
echo       statusDiv.textContent = `Cleared ${clearedCount} storage items. You can close this window now.`;
echo       
echo       // Also try to clear all indexedDB data if applicable
echo       if ('indexedDB' in window) {
echo         indexedDB.databases().then(databases => {
echo           databases.forEach(database => {
echo             indexedDB.deleteDatabase(database.name);
echo             console.log('Cleared indexedDB:', database.name);
echo           });
echo         });
echo       }
echo     }
echo     
echo     // Run the function when the page loads
echo     window.onload = clearLocalStorage;
echo   ^</script^>
echo ^</body^>
echo ^</html^>
) > %TEMP_HTML%

:: Open the HTML file in the default browser
start "" %TEMP_HTML%

echo.
echo A browser window has been opened to clear localStorage data.
echo.
echo After the process is complete, you can close the browser window.
echo Then refresh your ErpSoul application to see the changes.
echo.

pause
