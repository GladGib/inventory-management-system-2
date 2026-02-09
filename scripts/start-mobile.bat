@echo off
title IMS - Mobile Application Startup
color 0B

echo ============================================
echo  Inventory Management System - Mobile App
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

:: Check if Flutter is installed
flutter --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Flutter is not installed or not in PATH.
    echo Please install Flutter: https://docs.flutter.dev/get-started/install
    echo.
    pause
    exit /b 1
)

:: ============================================
:: Check and Start PostgreSQL
:: ============================================
echo [1/4] Checking PostgreSQL database...

docker ps --filter "name=ims-postgres" --filter "status=running" | findstr "ims-postgres" >nul 2>&1
if %errorlevel%==0 (
    echo   PostgreSQL is already running. Skipping...
) else (
    echo   Starting PostgreSQL...
    cd /d "%PROJECT_ROOT%"
    docker compose up -d postgres
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

netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   Backend is already running on port 3001. Skipping...
) else (
    echo   Starting Backend API server...
    start "IMS Backend" cmd /k "cd /d "%PROJECT_ROOT%\backend" && npm run dev"
    echo   Waiting for backend to initialize...
    timeout /t 5 /nobreak >nul
)

:: ============================================
:: Check Flutter dependencies
:: ============================================
echo.
echo [3/4] Checking Flutter dependencies...
cd /d "%PROJECT_ROOT%\mobile"
call flutter pub get >nul 2>&1

:: ============================================
:: Start Flutter App
:: ============================================
echo.
echo [4/4] Starting Flutter Mobile App...
echo.
echo  Available options:
echo    1. Run on Chrome (Web debug)
echo    2. Run on Android Emulator
echo    3. Run on Connected Device
echo    4. Just open VS Code (manual run)
echo.
set /p choice="Select option (1-4): "

if "%choice%"=="1" (
    echo.
    echo Checking if Flutter web is already running...
    :: Check for existing flutter run process - just start new one
    echo Starting Flutter app on Chrome...
    start "IMS Mobile" cmd /k "cd /d "%PROJECT_ROOT%\mobile" && flutter run -d chrome"
) else if "%choice%"=="2" (
    echo.
    echo Starting Flutter app on Android Emulator...
    start "IMS Mobile" cmd /k "cd /d "%PROJECT_ROOT%\mobile" && flutter run -d emulator"
) else if "%choice%"=="3" (
    echo.
    echo Starting Flutter app on connected device...
    start "IMS Mobile" cmd /k "cd /d "%PROJECT_ROOT%\mobile" && flutter run"
) else if "%choice%"=="4" (
    echo.
    echo Opening VS Code...
    code "%PROJECT_ROOT%\mobile"
) else (
    echo Invalid option. Opening VS Code...
    code "%PROJECT_ROOT%\mobile"
)

echo.
echo ============================================
echo  Service Status:
echo ============================================

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

echo   [OK] Mobile App: Running in separate window
echo.
echo ============================================
echo.
echo  Press any key to exit this window...
pause >nul
