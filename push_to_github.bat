@echo off
echo ================================================================
echo 🐙 Pushing EcoFlow AI to GitHub: sanjay00007sanjay-blip/SANJAYFSD
echo ================================================================

set "PATH=%~dp0.tools\git\cmd;%PATH%"

cd /d "%~dp0"

echo [1/3] Checking Git Status...
git status

echo.
echo [2/3] Setting remote to https://github.com/sanjay00007sanjay-blip/SANJAYFSD.git...
git remote set-url origin https://github.com/sanjay00007sanjay-blip/SANJAYFSD.git

echo.
echo [3/3] Pushing to GitHub (main branch)...
echo Note: If prompted, sign in via browser or paste your GitHub Personal Access Token.
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================
    echo 🎉 Successfully pushed to https://github.com/sanjay00007sanjay-blip/SANJAYFSD
    echo ================================================================
) else (
    echo.
    echo ================================================================
    echo ⚠️ Push did not complete. If you need to use a GitHub Token:
    echo git push https://YOUR_TOKEN@github.com/sanjay00007sanjay-blip/SANJAYFSD.git main
    echo ================================================================
)

pause
