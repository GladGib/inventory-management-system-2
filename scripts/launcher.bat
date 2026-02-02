@echo off
title Inventory Management System - Launcher
color 0F

:: Set the project root directory (parent of scripts folder)
set "PROJECT_ROOT=%~dp0.."

:menu
cls
echo.
echo  ============================================
echo     INVENTORY MANAGEMENT SYSTEM
echo     Demo Auto Parts Sdn Bhd
echo  ============================================
echo.
echo     Select an option:
echo.
echo     [1] Start Web Application
echo         (PostgreSQL + Backend + Next.js Web)
echo.
echo     [2] Start Mobile Application
echo         (PostgreSQL + Backend + Flutter Mobile)
echo.
echo     [3] Start Backend Services Only
echo         (PostgreSQL + Backend API)
echo.
echo     [4] Stop All Services
echo         (Shutdown everything)
echo.
echo     [5] Check Service Status
echo         (See what's running)
echo.
echo     [6] Open pgAdmin (Database UI)
echo.
echo     [7] Run Database Migrations
echo.
echo     [8] Seed Database (Sample Data)
echo.
echo     [0] Exit
echo.
echo  ============================================
echo.
set /p choice="  Enter your choice (0-8): "

if "%choice%"=="1" goto start_web
if "%choice%"=="2" goto start_mobile
if "%choice%"=="3" goto start_backend
if "%choice%"=="4" goto stop_all
if "%choice%"=="5" goto status
if "%choice%"=="6" goto pgadmin
if "%choice%"=="7" goto migrate
if "%choice%"=="8" goto seed
if "%choice%"=="0" goto exit
goto menu

:start_web
call "%~dp0start-web.bat"
goto menu

:start_mobile
call "%~dp0start-mobile.bat"
goto menu

:start_backend
cls
echo.
echo  ============================================
echo   Starting Backend Services Only
echo  ============================================
echo.

:: Check Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    goto menu
)

:: Check and start PostgreSQL
echo [1/2] Checking PostgreSQL...
docker ps --filter "name=ims-postgres" --filter "status=running" | findstr "ims-postgres" >nul 2>&1
if %errorlevel%==0 (
    echo   PostgreSQL is already running. Skipping...
) else (
    echo   Starting PostgreSQL...
    cd /d "%PROJECT_ROOT%"
    docker-compose up -d postgres
    timeout /t 5 /nobreak >nul
)

:: Check and start Backend
echo.
echo [2/2] Checking Backend API...
netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   Backend is already running on port 3001. Skipping...
) else (
    echo   Starting Backend API server...
    start "IMS Backend" cmd /k "cd /d "%PROJECT_ROOT%\backend" && npm run dev"
)

echo.
echo  Backend services started/verified.
echo  API available at: http://localhost:3001
echo.
pause
goto menu

:stop_all
call "%~dp0stop-all.bat"
goto menu

:status
cls
echo.
echo  ============================================
echo   Service Status Check
echo  ============================================
echo.

:: Check Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo   [--] Docker Desktop: Not running
) else (
    echo   [OK] Docker Desktop: Running
)

:: Check PostgreSQL
docker ps --filter "name=ims-postgres" --filter "status=running" | findstr "ims-postgres" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] PostgreSQL: Running (localhost:5432)
) else (
    echo   [--] PostgreSQL: Not running
)

:: Check Backend
netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Backend API: Running (http://localhost:3001)
) else (
    echo   [--] Backend API: Not running
)

:: Check Web Frontend
netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Web Frontend: Running (http://localhost:3000)
) else (
    echo   [--] Web Frontend: Not running
)

:: Check pgAdmin
docker ps --filter "name=ims-pgadmin" --filter "status=running" | findstr "ims-pgadmin" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] pgAdmin: Running (http://localhost:5050)
) else (
    echo   [--] pgAdmin: Not running
)

echo.
echo  ============================================
echo.
pause
goto menu

:pgadmin
cls
echo.
echo  Starting pgAdmin...
echo.

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    goto menu
)

:: Check if already running
docker ps --filter "name=ims-pgadmin" --filter "status=running" | findstr "ims-pgadmin" >nul 2>&1
if %errorlevel%==0 (
    echo   pgAdmin is already running.
) else (
    echo   Starting pgAdmin container...
    cd /d "%PROJECT_ROOT%"
    docker-compose --profile tools up -d pgadmin
)

echo.
echo  pgAdmin: http://localhost:5050
echo  Email: admin@ims.local
echo  Password: admin
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5050
pause
goto menu

:migrate
cls
echo.
echo  Running Database Migrations...
echo.
cd /d "%PROJECT_ROOT%\backend"
call npm run db:migrate
echo.
pause
goto menu

:seed
cls
echo.
echo  Seeding Database with Sample Data...
echo.
cd /d "%PROJECT_ROOT%\backend"
call npm run db:seed
echo.
pause
goto menu

:exit
echo.
echo  Goodbye!
timeout /t 1 /nobreak >nul
exit /b 0
