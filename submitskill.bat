@echo off
chcp 65001 >nul
REM GitHub Auto Commit Script (Windows)
REM Usage: Place in project folder, double-click to run

cd /d "%~dp0"

if not exist ".git" (
    echo [ERROR] Not a Git repository! Please run git init first.
    pause
    exit /b 1
)

for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set BRANCH=%%b
if "%BRANCH%"=="" set BRANCH=main

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No remote repository found! Please run: git remote add origin ^<url^>
    pause
    exit /b 1
)

for /f "tokens=*" %%r in ('git remote get-url origin') do set REMOTE=%%r

echo ============================================
echo  Repo:   %REMOTE%
echo  Branch: %BRANCH%
echo ============================================
echo.
set /p MSG=Enter commit message: 

if "%MSG%"=="" (
    echo [ERROR] Commit message cannot be empty!
    pause
    exit /b 1
)

echo.
echo [INFO] Committing...
echo        Message: %MSG%

git add -A

git diff --cached --quiet
if not errorlevel 1 (
    echo [INFO] No changes detected, nothing to commit.
    pause
    exit /b 0
)

git commit -m "%MSG%"
if errorlevel 1 (
    echo [ERROR] git commit failed!
    pause
    exit /b 1
)

for /f "tokens=*" %%s in ('git rev-parse --short HEAD') do set SHORT_SHA=%%s

git push origin %BRANCH%
if errorlevel 1 (
    echo [ERROR] git push failed! Try git pull first or check permissions.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  SUCCESS!
echo  Commit:  %SHORT_SHA%
echo  Message: %MSG%
echo  Branch:  %BRANCH%
echo ============================================
pause
