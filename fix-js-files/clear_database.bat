@echo off
echo ============================================
echo Clear Database Data for ErpSoul
echo ============================================
echo.
echo This script will clear all data from:
echo - Customers table
echo - Inventory table
echo.
echo The database structure will remain intact.
echo.

choice /C YN /M "Do you want to continue"
if errorlevel 2 exit /b

echo.
echo Clearing database data...
echo.

:: Get the directory where the batch file is located
set PROJECT_DIR=%~dp0

:: Execute the Node.js script with relative path
cd /d "%PROJECT_DIR%"
node clear_database.js

echo.
echo Database data has been cleared successfully!
echo.
echo All records from Customers and Inventory tables have been deleted.
echo The database structure remains intact.
echo.

pause
