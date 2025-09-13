@echo off
echo Committing and Pushing Changes to Git Repository
echo ==============================================
echo.
echo This script will commit all changes and push them to your repository.
echo.
pause

REM Add all files to staging
echo Adding all files to staging area...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to add files to staging area.
    pause
    exit /b %errorlevel%
)
echo Files added to staging area successfully.
echo.

REM Commit the changes
echo Committing changes...
git commit -m "Remove Electron and fix desktop icon creation"
if %errorlevel% neq 0 (
    echo ERROR: Failed to commit changes.
    pause
    exit /b %errorlevel%
)
echo Changes committed successfully.
echo.

REM Push to remote repository
echo Pushing changes to remote repository...
git push
if %errorlevel% neq 0 (
    echo ERROR: Failed to push changes to remote repository.
    echo You may need to check your repository URL or credentials.
    pause
    exit /b %errorlevel%
)
echo Changes pushed successfully!
echo.
echo All changes have been committed and pushed to the repository.
pause
