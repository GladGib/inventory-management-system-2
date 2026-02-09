@echo off
title IMS - Shutdown All Services
color 0C

echo ============================================
echo  Inventory Management System - Shutdown
echo ============================================
echo.

:: Set the project root directory (parent of scripts folder)
set "PROJECT_ROOT=%~dp0.."
set "ANYTHING_STOPPED=0"

:: ============================================
:: Check and Stop Web Frontend (port 3000)
:: ============================================
echo [1/4] Checking Web Frontend...

netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   Stopping Web Frontend on port 3000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    set "ANYTHING_STOPPED=1"
    echo   Web Frontend stopped.
) else (
    echo   Web Frontend is not running. Skipping...
)

:: ============================================
:: Check and Stop Backend (port 3001)
:: ============================================
echo.
echo [2/4] Checking Backend API...

netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   Stopping Backend API on port 3001...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    set "ANYTHING_STOPPED=1"
    echo   Backend API stopped.
) else (
    echo   Backend API is not running. Skipping...
)

:: ============================================
:: Check and Stop Flutter processes
:: ============================================
echo.
echo [3/4] Checking Flutter/Dart processes...

tasklist /FI "IMAGENAME eq dart.exe" 2>nul | findstr "dart.exe" >nul 2>&1
if %errorlevel%==0 (
    echo   Stopping Flutter/Dart processes...
    taskkill /F /IM dart.exe /T >nul 2>&1
    set "ANYTHING_STOPPED=1"
    echo   Flutter processes stopped.
) else (
    echo   No Flutter processes running. Skipping...
)

:: ============================================
:: Check and Stop Docker containers
:: ============================================
echo.
echo [4/4] Checking Docker containers...

docker info >nul 2>&1
if errorlevel 1 (
    echo   Docker is not running. Skipping...
) else (
    docker ps --filter "name=ims-postgres" --filter "status=running" | findstr "ims-postgres" >nul 2>&1
    if %errorlevel%==0 (
        echo   Stopping PostgreSQL container...
        cd /d "%PROJECT_ROOT%"
        docker compose down >nul 2>&1
        set "ANYTHING_STOPPED=1"
        echo   Docker containers stopped.
    ) else (
        echo   No IMS Docker containers running. Skipping...
    )
)

:: ============================================
:: Close terminal windows
:: ============================================
echo.
echo Closing IMS terminal windows...
taskkill /FI "WINDOWTITLE eq IMS Backend*" /T >nul 2>&1
taskkill /FI "WINDOWTITLE eq IMS Web*" /T >nul 2>&1
taskkill /FI "WINDOWTITLE eq IMS Mobile*" /T >nul 2>&1

:: ============================================
:: Summary
:: ============================================
echo.
echo ============================================
if "%ANYTHING_STOPPED%"=="1" (
    echo  Services have been stopped!
) else (
    echo  No services were running.
)
echo ============================================
echo.

:: Final status verification
echo  Final Status:
docker ps --filter "name=ims-postgres" --filter "status=running" | findstr "ims-postgres" >nul 2>&1
if %errorlevel%==0 (
    echo   [!!] PostgreSQL: Still running
) else (
    echo   [OK] PostgreSQL: Stopped
)

netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [!!] Backend API: Still running
) else (
    echo   [OK] Backend API: Stopped
)

netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [!!] Web App: Still running
) else (
    echo   [OK] Web App: Stopped
)

echo.
echo  Press any key to exit...
pause >nul
