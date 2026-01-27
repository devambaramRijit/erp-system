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

:: Check if node-sqlite3 is available
set PROJECT_DIR="d:5eacteact dev\ErpSoul-Refactored_v4.4_sqlite"
set CLEAR_SCRIPT_PATH="%PROJECT_DIR%\clear_database.js"

:: Create a Node.js script to clear the database
(
echo const sqlite3 = require('sqlite3').verbose();
echo const path = require('path');
echo.
echo const dbPath = path.join(__dirname, 'server', 'config', 'database.sqlite');
echo const db = new sqlite3.Database(dbPath);
echo.
echo console.log('Connected to the database.');
echo.
echo // Clear Customers table
echo db.run('DELETE FROM Customers', function(err) {
echo   if (err) {
echo     return console.error(err.message);
echo   }
echo   console.log(`Deleted ${this.changes} rows from Customers table`);
echo });
echo.
echo // Clear Inventory table
echo db.run('DELETE FROM Inventory', function(err) {
echo   if (err) {
echo     return console.error(err.message);
echo   }
echo   console.log(`Deleted ${this.changes} rows from Inventory table`);
echo });
echo.
echo // Close the database connection
echo db.close((err) => {
echo   if (err) {
echo     return console.error(err.message);
echo   }
echo   console.log('Database connection closed.');
echo });
) > %CLEAR_SCRIPT_PATH%

:: Execute the Node.js script
cd /d %PROJECT_DIR%
node clear_database.js

:: Clean up the temporary script
del %CLEAR_SCRIPT_PATH%

echo.
echo Database data has been cleared successfully!
echo.
echo All records from Customers and Inventory tables have been deleted.
echo The database structure remains intact.
echo.

pause
