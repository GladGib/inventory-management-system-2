@echo off
title IMS - Web Application Startup
color 0A

echo ============================================
echo  Inventory Management System - Web App
echo ============================================
echo.

:: Set the project root directory (parent of scripts folder)
set "PROJECT_ROOT=%~dp0.."

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

:: ============================================
:: Check and Start PostgreSQL
:: ============================================
echo [1/4] Checking PostgreSQL database...

:: Check if postgres container is running
docker ps --filter "name=ims-postgres" --filter "status=running" | findstr "ims-postgres" >nul 2>&1
if %errorlevel%==0 (
    echo   PostgreSQL is already running. Skipping...
) else (
    echo   Starting PostgreSQL...
    cd /d "%PROJECT_ROOT%"
    docker-compose up -d postgres
    if errorlevel 1 (
        echo [ERROR] Failed to start PostgreSQL container.
        pause
        exit /b 1
    )
    echo   Waiting for database to be ready...
    timeout /t 5 /nobreak >nul
)

:: ============================================
:: Check and Start Backend
:: ============================================
echo.
echo [2/4] Checking Backend API server...

:: Check if port 3001 is in use (backend running)
netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   Backend is already running on port 3001. Skipping...
) else (
    echo   Starting Backend API server...
    start "IMS Backend" cmd /k "cd /d "%PROJECT_ROOT%\backend" && npm run dev"
    echo   Waiting for backend to initialize...
    timeout /t 3 /nobreak >nul
)

:: ============================================
:: Check and Start Web Frontend
:: ============================================
echo.
echo [3/4] Checking Web Frontend...

:: Check if port 3000 is in use (web running)
netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   Web Frontend is already running on port 3000. Skipping...
) else (
    echo   Starting Web Frontend...
    start "IMS Web" cmd /k "cd /d "%PROJECT_ROOT%\web" && npm run dev"
)

:: ============================================
:: Summary
:: ============================================
echo.
echo [4/4] Verifying services...
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo  Service Status:
echo ============================================

:: Final status check
docker ps --filter "name=ims-postgres" --filter "status=running" | findstr "ims-postgres" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] PostgreSQL: localhost:5432
) else (
    echo   [--] PostgreSQL: Not running
)

netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Backend API: http://localhost:3001
) else (
    echo   [..] Backend API: Starting...
)

netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Web App: http://localhost:3000
) else (
    echo   [..] Web App: Starting...
)

echo.
echo ============================================
echo.
echo  Press any key to open the web app...
pause >nul

start http://localhost:3000
