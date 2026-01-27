@echo off
echo ============================================
echo Clear All Browser Storage for ErpSoul
echo ============================================
echo.
echo This batch file will clear all browser data:
echo - localStorage
echo - sessionStorage
echo - indexedDB
echo - cookies
echo - application cache
echo.
echo This will force the app to fetch fresh data from the server.
echo.

choice /C YN /M "Do you want to continue"
if errorlevel 2 exit /b

echo.
echo Creating a script to clear all browser storage...
echo.

:: Create a temporary HTML file to clear all browser storage
set TEMP_HTML=%TEMP%\clearAllBrowserStorage.html
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo   ^<title^>Clear All Browser Storage^</title^>
echo ^</head^>
echo ^<body^>
echo   ^<h1^>Clearing All Browser Storage...^</h1^>
echo   ^<div id="status"^>Processing...^</div^>
echo   ^<script^>
echo     // Function to clear all browser storage
echo     function clearAllStorage() {
echo       let clearedCount = 0;
echo       const statusDiv = document.getElementById('status');
echo       
echo       // Clear localStorage
echo       const localKeys = Object.keys(localStorage);
echo       console.log('Found localStorage keys:', localKeys);
echo       localKeys.forEach(key => {
echo         localStorage.removeItem(key);
echo         clearedCount++;
echo         console.log('Cleared localStorage key:', key);
echo       });
echo       
echo       // Clear sessionStorage
echo       const sessionKeys = Object.keys(sessionStorage);
echo       console.log('Found sessionStorage keys:', sessionKeys);
echo       sessionKeys.forEach(key => {
echo         sessionStorage.removeItem(key);
echo         clearedCount++;
echo         console.log('Cleared sessionStorage key:', key);
echo       });
echo       
echo       // Clear indexedDB
echo       if ('indexedDB' in window) {
echo         indexedDB.databases().then(databases => {
echo           databases.forEach(database => {
echo             indexedDB.deleteDatabase(database.name);
echo             console.log('Cleared indexedDB:', database.name);
echo             clearedCount++;
echo           });
echo         });
echo       }
echo       
echo       // Clear cookies for the current domain
echo       const cookies = document.cookie.split(';');
echo       cookies.forEach(cookie => {
echo         const eqPos = cookie.indexOf('=');
echo         const name = eqPos ^> -1 ? cookie.substr(0, eqPos) : cookie;
echo         document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
echo         clearedCount++;
echo         console.log('Cleared cookie:', name);
echo       });
echo       
echo       // Clear application cache
echo       if ('applicationCache' in window) {
echo         try {
echo           window.applicationCache.update();
echo           window.applicationCache.swapCache();
echo           console.log('Cleared application cache');
echo           clearedCount++;
echo         } catch (e) {
echo           console.error('Error clearing application cache:', e);
echo         }
echo       }
echo       
echo       // Clear service workers
echo       if ('serviceWorker' in navigator) {
echo         navigator.serviceWorker.getRegistrations().then(registrations => {
echo           registrations.forEach(registration => {
echo             registration.unregister();
echo             console.log('Unregistered service worker');
echo             clearedCount++;
echo           });
echo         });
echo       }
echo       
echo       statusDiv.textContent = `Cleared ${clearedCount} storage items. You can close this window now.`;
echo       console.log(`Total items cleared: ${clearedCount}`);
echo     }
echo     
echo     // Run the function when the page loads
echo     window.onload = clearAllStorage;
echo   ^</script^>
echo ^</body^>
echo ^</html^>
) > %TEMP_HTML%

:: Open the HTML file in the default browser
start "" %TEMP_HTML%

echo.
echo A browser window has been opened to clear all browser storage.
echo.
echo After the process is complete, close the browser window.
echo Then refresh your ErpSoul application to see the changes.
echo.
echo You may also want to clear your browser cache manually by:
echo 1. Opening Developer Tools (F12)
echo 2. Right-clicking the refresh button
echo 3. Selecting "Empty Cache and Hard Reload"
echo.

pause
