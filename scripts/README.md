# IMS Scripts

This folder contains utility scripts to manage the Inventory Management System services.

## Prerequisites

Before running these scripts, ensure you have:

- **Docker Desktop** - Running and accessible from command line
- **Node.js** - v18+ with npm
- **Flutter SDK** - (Only required for mobile app)

## Scripts

### `launcher.bat` (Recommended)

Interactive menu to manage all services. Double-click to run.

```
============================================
   INVENTORY MANAGEMENT SYSTEM
============================================

   [1] Start Web Application
   [2] Start Mobile Application
   [3] Start Backend Services Only
   [4] Stop All Services
   [5] Check Service Status
   [6] Open pgAdmin (Database UI)
   [7] Run Database Migrations
   [8] Seed Database (Sample Data)
   [0] Exit
```

---

### `start-web.bat`

Starts all services needed for the **web application**:

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database (Docker) |
| Backend API | 3001 | NestJS REST API |
| Web Frontend | 3000 | Next.js Application |

**Usage:** Double-click or run from command prompt.

**Behavior:**
- Checks if each service is already running before starting
- Skips services that are already active (no duplicates)
- Opens browser to http://localhost:3000 when ready

---

### `start-mobile.bat`

Starts all services needed for **mobile app development**:

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database (Docker) |
| Backend API | 3001 | NestJS REST API |
| Flutter App | - | Mobile application |

**Usage:** Double-click or run from command prompt.

**Options when running:**
1. Run on Chrome (Web debug)
2. Run on Android Emulator
3. Run on Connected Device
4. Open VS Code (manual run)

**Behavior:**
- Checks if PostgreSQL and Backend are already running
- Skips services that are already active
- Prompts for Flutter run target

---

### `stop-all.bat`

Stops all running IMS services:

- Terminates processes on ports 3000 and 3001
- Stops Flutter/Dart processes
- Stops PostgreSQL Docker container
- Closes IMS terminal windows

**Usage:** Double-click or run from command prompt.

**Behavior:**
- Checks if each service is running before attempting to stop
- Skips services that aren't running (no errors)
- Shows final status verification

---

## Service Ports

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Next.js Frontend |
| Backend API | http://localhost:3001 | NestJS REST API |
| PostgreSQL | localhost:5432 | Database |
| pgAdmin | http://localhost:5050 | Database UI (optional) |

## Idempotent Design

All scripts are designed to be **idempotent** - safe to run multiple times:

| Action | If Already Done | Result |
|--------|-----------------|--------|
| Start service | Already running | "Skipping..." (no duplicate) |
| Stop service | Not running | "Skipping..." (no error) |

## Troubleshooting

### Docker not running
```
[ERROR] Docker is not running. Please start Docker Desktop first.
```
**Solution:** Start Docker Desktop and wait for it to fully initialize.

### Port already in use
If a port is in use by another application:
1. Run `stop-all.bat` to clean up
2. Or manually find and kill the process:
   ```cmd
   netstat -ano | findstr :3000
   taskkill /F /PID <PID>
   ```

### Flutter not found
```
[ERROR] Flutter is not installed or not in PATH.
```
**Solution:** Install Flutter SDK and add to PATH:
https://docs.flutter.dev/get-started/install

### Database connection issues
1. Ensure PostgreSQL container is running:
   ```cmd
   docker ps
   ```
2. Check container logs:
   ```cmd
   docker logs ims-postgres
   ```

## Quick Start

1. **First time setup:**
   ```cmd
   launcher.bat
   # Select [7] Run Database Migrations
   # Select [8] Seed Database
   ```

2. **Start web app:**
   ```cmd
   start-web.bat
   ```
   Or use `launcher.bat` → Option [1]

3. **When done:**
   ```cmd
   stop-all.bat
   ```
   Or use `launcher.bat` → Option [4]
