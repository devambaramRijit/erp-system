@echo off
echo ============================================
echo Clear Database Data for ErpSoul
echo ============================================
echo.
echo This batch file will clear all data from:
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

:: Path to the SQLite database
set DB_PATH="d:5eacteact dev\ErpSoul-Refactored_v4.4_sqlite\server\config\database.sqlite"

:: Check if sqlite3 is available
where sqlite3 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo SQLite3 command line tool is not found in your PATH.
    echo Please install SQLite3 or add it to your PATH.
    echo You can download it from: https://www.sqlite.org/download.html
    echo.
    pause
    exit /b
)

:: Create a temporary SQL script
echo DELETE FROM Customers; > %TEMP%\clear_data.sql
echo DELETE FROM Inventory; >> %TEMP%\clear_data.sql

:: Execute the SQL script
sqlite3 %DB_PATH% < %TEMP%\clear_data.sql

:: Clean up the temporary SQL script
del %TEMP%\clear_data.sql

echo.
echo Database data has been cleared successfully!
echo.
echo All records from Customers and Inventory tables have been deleted.
echo The database structure remains intact.
echo.

pause
