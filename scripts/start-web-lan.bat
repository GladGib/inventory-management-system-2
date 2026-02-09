@echo off
title IMS - Web Application - LAN Mode
color 0B

echo ============================================
echo  Inventory Management System - LAN Mode
echo  Accessible from other devices on your WiFi
echo ============================================
echo.

:: Set the project root directory (parent of scripts folder)
set "PROJECT_ROOT=%~dp0.."

:: Track what this script created so we only clean up our own changes
set "ADDED_FW_3000=0"
set "ADDED_FW_3001=0"
set "STARTED_POSTGRES=0"
set "STARTED_BACKEND=0"
set "STARTED_WEB=0"

:: ============================================
:: Detect LAN IP Address
:: ============================================
echo [*] Detecting network adapters...
echo.

set "IP_COUNT=0"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set /a IP_COUNT+=1
    for /f "tokens=1" %%b in ("%%a") do (
        call set "IP_%%IP_COUNT%%=%%b"
        call echo   [%%IP_COUNT%%] %%b
    )
)

if "%IP_COUNT%"=="0" (
    echo [ERROR] Could not detect any IP addresses.
    echo         Make sure you are connected to WiFi.
    echo.
    pause
    exit /b 1
)

echo.
echo   Tip: Pick your WiFi adapter IP, usually 192.168.x.x
echo   Avoid virtual adapter IPs like 172.x.x.x or 10.x.x.x
echo.
set /p IP_CHOICE="  Enter the number of your WiFi IP: "

call set "LAN_IP=%%IP_%IP_CHOICE%%%"

if not defined LAN_IP (
    echo [ERROR] Invalid selection.
    pause
    exit /b 1
)

echo.
echo   Using LAN IP: %LAN_IP%
echo.

:: ============================================
:: Check Docker
:: ============================================
echo [1/5] Checking Docker...

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)
echo   Docker is running.

:: ============================================
:: Check and Start PostgreSQL
:: ============================================
echo.
echo [2/5] Checking PostgreSQL database...

docker ps --filter "name=ims-postgres" --filter "status=running" | findstr "ims-postgres" >nul 2>&1
if %errorlevel%==0 (
    echo   PostgreSQL is already running. Skipping...
    goto backend_check
)

echo   Starting PostgreSQL...
cd /d "%PROJECT_ROOT%"
docker compose up -d postgres
if errorlevel 1 (
    echo [ERROR] Failed to start PostgreSQL container.
    pause
    exit /b 1
)
set "STARTED_POSTGRES=1"
echo   Waiting for database to be ready...
timeout /t 5 /nobreak >nul

:: ============================================
:: Check and Start Backend API
:: ============================================
:backend_check
echo.
echo [3/5] Checking Backend API server...

netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   Backend is already running on port 3001. Skipping...
    goto web_check
)

echo   Starting Backend API server...
echo   Setting CORS to allow http://localhost:3000 and http://%LAN_IP%:3000
start "IMS Backend" cmd /k "cd /d "%PROJECT_ROOT%\backend" && set CORS_ORIGIN=http://localhost:3000,http://%LAN_IP%:3000&& npm run dev"
set "STARTED_BACKEND=1"
echo   Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

:: ============================================
:: Check and Start Web Frontend (LAN mode)
:: ============================================
:web_check
echo.
echo [4/5] Checking Web Frontend...

netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   Web Frontend is already running on port 3000.
    echo   NOTE: If it was started without LAN mode, restart it.
    echo         Run stop-all.bat first, then run this script again.
    goto firewall_check
)

echo   Starting Web Frontend in LAN mode...
echo   Setting API URL to http://%LAN_IP%:3001/api/v1
start "IMS Web LAN" cmd /k "cd /d "%PROJECT_ROOT%\web" && set NEXT_PUBLIC_API_URL=http://%LAN_IP%:3001/api/v1&& npx next dev -H 0.0.0.0"
set "STARTED_WEB=1"

:: ============================================
:: Add Firewall Rules (if needed)
:: ============================================
:firewall_check
echo.
echo [5/5] Checking firewall rules...

netsh advfirewall firewall show rule name="IMS Web LAN 3000" >nul 2>&1
if %errorlevel%==0 (
    echo   Firewall rule for port 3000 already exists.
    goto firewall_3001
)

echo   Adding firewall rule for port 3000...
echo   You may see a UAC prompt - please allow it
powershell -Command "Start-Process netsh -ArgumentList 'advfirewall firewall add rule name=\"IMS Web LAN 3000\" dir=in action=allow protocol=TCP localport=3000' -Verb RunAs -Wait" >nul 2>&1
set "ADDED_FW_3000=1"

:firewall_3001
netsh advfirewall firewall show rule name="IMS Backend LAN 3001" >nul 2>&1
if %errorlevel%==0 (
    echo   Firewall rule for port 3001 already exists.
    goto services_ready
)

echo   Adding firewall rule for port 3001...
powershell -Command "Start-Process netsh -ArgumentList 'advfirewall firewall add rule name=\"IMS Backend LAN 3001\" dir=in action=allow protocol=TCP localport=3001' -Verb RunAs -Wait" >nul 2>&1
set "ADDED_FW_3001=1"

:: ============================================
:: Wait and verify
:: ============================================
:services_ready
echo.
echo   Waiting for services to be ready...
timeout /t 5 /nobreak >nul

:: ============================================
:: Summary
:: ============================================
echo.
echo ============================================
echo  Service Status:
echo ============================================

:: Check PostgreSQL
docker ps --filter "name=ims-postgres" --filter "status=running" | findstr "ims-postgres" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] PostgreSQL:  localhost:5432
) else (
    echo   [--] PostgreSQL:  Not running
)

:: Check Backend
netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Backend API:  http://%LAN_IP%:3001
) else (
    echo   [..] Backend API:  Starting...
)

:: Check Web
netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] Web App:      http://%LAN_IP%:3000
) else (
    echo   [..] Web App:      Starting...
)

echo.
echo ============================================
echo  ACCESS FROM OTHER DEVICES:
echo ============================================
echo.
echo   On this computer:
echo     http://localhost:3000
echo.
echo   On other devices - same WiFi:
echo     http://%LAN_IP%:3000
echo.
echo ============================================
echo.

:: Open the browser
start http://localhost:3000

echo  The app is running. Press any key to STOP
echo  all services and clean up firewall rules.
echo.
pause >nul

:: ============================================
:: CLEANUP - Stop services and remove firewall rules
:: ============================================
echo.
echo ============================================
echo  Shutting down LAN mode...
echo ============================================
echo.

:: Stop Web Frontend
if not "%STARTED_WEB%"=="1" goto skip_stop_web
echo [1/4] Stopping Web Frontend...
taskkill /FI "WINDOWTITLE eq IMS Web LAN*" /T /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo   Web Frontend stopped.
goto stop_backend
:skip_stop_web
echo [1/4] Web Frontend was already running before. Leaving it.

:: Stop Backend
:stop_backend
if not "%STARTED_BACKEND%"=="1" goto skip_stop_backend
echo [2/4] Stopping Backend API...
taskkill /FI "WINDOWTITLE eq IMS Backend*" /T /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo   Backend API stopped.
goto stop_postgres
:skip_stop_backend
echo [2/4] Backend API was already running before. Leaving it.

:: Stop PostgreSQL
:stop_postgres
if not "%STARTED_POSTGRES%"=="1" goto skip_stop_postgres
echo [3/4] Stopping PostgreSQL...
cd /d "%PROJECT_ROOT%"
docker compose stop postgres >nul 2>&1
echo   PostgreSQL stopped.
goto cleanup_firewall
:skip_stop_postgres
echo [3/4] PostgreSQL was already running before. Leaving it.

:: Remove firewall rules
:cleanup_firewall
echo [4/4] Cleaning up firewall rules...

if not "%ADDED_FW_3000%"=="1" goto skip_fw_3000
echo   Removing firewall rule for port 3000...
powershell -Command "Start-Process netsh -ArgumentList 'advfirewall firewall delete rule name=\"IMS Web LAN 3000\"' -Verb RunAs -Wait" >nul 2>&1
echo   Firewall rule for port 3000 removed.
goto check_fw_3001
:skip_fw_3000
echo   Firewall rule for port 3000 was not added by this session. Leaving it.

:check_fw_3001
if not "%ADDED_FW_3001%"=="1" goto skip_fw_3001
echo   Removing firewall rule for port 3001...
powershell -Command "Start-Process netsh -ArgumentList 'advfirewall firewall delete rule name=\"IMS Backend LAN 3001\"' -Verb RunAs -Wait" >nul 2>&1
echo   Firewall rule for port 3001 removed.
goto cleanup_done
:skip_fw_3001
echo   Firewall rule for port 3001 was not added by this session. Leaving it.

:: ============================================
:: Final status
:: ============================================
:cleanup_done
echo.
echo ============================================
echo  Cleanup complete!
echo ============================================
echo.
echo  Everything started by this LAN session has
echo  been stopped and firewall rules removed.
echo.
echo  Press any key to exit...
pause >nul
