# IMS Deployment Guide

Comprehensive deployment guide for the Inventory Management System -- backend API, web frontend, and mobile applications.

---

## Prerequisites

| Tool           | Version  | Purpose                        |
| -------------- | -------- | ------------------------------ |
| Node.js        | >= 20.x  | Backend runtime                |
| npm             | >= 10.x  | Package management             |
| Docker          | >= 24.x  | Containerised deployment       |
| Docker Compose  | >= 2.20  | Multi-container orchestration  |
| PostgreSQL      | >= 15    | Database (if running manually) |
| k6              | >= 0.47  | Performance testing (optional) |
| Flutter         | >= 3.x   | Mobile app builds              |

---

## 1. Backend Deployment

### Option A -- Docker (Recommended)

1. **Copy and configure environment variables**

   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with production values
   ```

2. **Create a `.env` file in the project root** for Docker Compose variables:

   ```env
   POSTGRES_USER=ims_user
   POSTGRES_PASSWORD=<strong-password>
   POSTGRES_DB=ims_db
   JWT_SECRET=<long-random-string>
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. **Build and start**

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Run database migrations** inside the running container:

   ```bash
   docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
   ```

5. **Verify** the API is running:

   ```bash
   curl http://localhost:3001/api/v1/health
   ```

### Option B -- Manual Deployment

1. **Install dependencies and build**

   ```bash
   cd backend
   npm ci
   npx prisma generate
   npm run build
   ```

2. **Set environment variables** (export them or use a `.env` file):

   ```bash
   export DATABASE_URL="postgresql://user:pass@host:5432/ims_db?schema=public"
   export JWT_SECRET="<long-random-string>"
   export NODE_ENV=production
   export PORT=3001
   ```

3. **Run database migrations**

   ```bash
   npm run migration:run
   ```

4. **Start the server**

   ```bash
   npm run start:prod
   ```

---

## 2. Database Setup and Migrations

### Initial Setup

```bash
# Create the database (if not using Docker)
createdb -U postgres ims_db

# Run all pending migrations
cd backend
npm run migration:run
```

### Seeding (Development / Staging)

```bash
npm run db:seed
```

### Useful Commands

| Command                   | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run migration:run`    | Apply all pending migrations             |
| `npm run migration:revert` | Reset database (destroys all data)       |
| `npm run migration:status` | Show current migration status            |
| `npm run db:seed`          | Seed database with sample data           |
| `npm run db:studio`        | Open Prisma Studio for visual DB editing |

---

## 3. Environment Variable Reference

| Variable                   | Required | Default                    | Description                                 |
| -------------------------- | -------- | -------------------------- | ------------------------------------------- |
| `DATABASE_URL`             | Yes      | --                         | PostgreSQL connection string                |
| `JWT_SECRET`               | Yes      | --                         | Secret for signing JWT tokens               |
| `JWT_EXPIRATION`           | No       | `15m`                      | Access token lifetime                       |
| `REFRESH_TOKEN_EXPIRATION` | No       | `7d`                       | Refresh token lifetime                      |
| `PORT`                     | No       | `3001`                     | API server port                             |
| `NODE_ENV`                 | No       | `development`              | `development`, `production`, or `test`      |
| `CORS_ORIGIN`              | No       | `http://localhost:3000`    | Comma-separated allowed origins             |
| `UPLOAD_DIR`               | No       | `./uploads`                | Directory for file uploads                  |
| `SMTP_HOST`                | No       | --                         | SMTP server hostname                        |
| `SMTP_PORT`                | No       | `587`                      | SMTP server port                            |
| `SMTP_USER`                | No       | --                         | SMTP authentication username                |
| `SMTP_PASS`                | No       | --                         | SMTP authentication password                |
| `SMTP_FROM`                | No       | `noreply@ims.local`        | Sender email address                        |

The `validateEnv()` function in `backend/src/config/env-validation.ts` checks for `DATABASE_URL` and `JWT_SECRET` at startup and halts the process if either is missing.

---

## 4. Web Deployment

### Option A -- Vercel (Recommended)

1. Push the repository to GitHub.
2. Import the project in Vercel and set the **Root Directory** to `web`.
3. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` -- your backend API URL (e.g., `https://api.your-domain.com/api/v1`)
4. Deploy. Vercel will detect Next.js automatically via `web/vercel.json`.

### Option B -- Static Export / Self-Hosted

1. **Build**

   ```bash
   cd web
   npm ci
   npm run build
   ```

2. **Start the Next.js server**

   ```bash
   npm run start
   ```

   Or serve the `.next` output with a reverse proxy (nginx, Caddy, etc.).

### Environment Variables (Web)

| Variable               | Description                          |
| ---------------------- | ------------------------------------ |
| `NEXT_PUBLIC_API_URL`  | Backend API base URL                 |

---

## 5. Mobile App Release

### Android

1. **Configure signing**

   ```bash
   cp mobile/android/key.properties.example mobile/android/key.properties
   # Edit key.properties with your keystore details
   ```

   Generate a keystore if you do not have one:

   ```bash
   keytool -genkey -v -keystore ~/ims-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias ims-key
   ```

2. **Build the release APK**

   ```bash
   cd mobile
   flutter build apk --release \
     --dart-define=API_BASE_URL=https://api.your-domain.com/api/v1 \
     --dart-define=PRODUCTION=true
   ```

   The APK will be at `build/app/outputs/flutter-apk/app-release.apk`.

3. **Build an App Bundle** (for Google Play):

   ```bash
   flutter build appbundle --release \
     --dart-define=API_BASE_URL=https://api.your-domain.com/api/v1 \
     --dart-define=PRODUCTION=true
   ```

### iOS

1. Open `mobile/ios/Runner.xcworkspace` in Xcode.
2. Configure signing with your Apple Developer account.
3. **Build**

   ```bash
   cd mobile
   flutter build ios --release \
     --dart-define=API_BASE_URL=https://api.your-domain.com/api/v1 \
     --dart-define=PRODUCTION=true
   ```

4. Archive and upload to App Store Connect via Xcode.

---

## 6. Performance Testing

Performance tests use [k6](https://k6.io/). Install k6 first, then run from the project root.

```bash
# Stock valuation report load test
k6 run backend/test/performance/stock-valuation.js \
  -e BASE_URL=http://localhost:3001/api/v1 \
  -e TEST_EMAIL=admin@ims.local \
  -e TEST_PASSWORD=Admin123!

# Sales by customer report load test
k6 run backend/test/performance/sales-report.js

# Concurrent order creation
k6 run backend/test/performance/concurrent-orders.js

# Concurrent stock updates
k6 run backend/test/performance/concurrent-stock.js
```

---

## 7. OpenAPI Spec Generation

Generate a standalone `openapi.json` file from the NestJS Swagger decorators:

```bash
cd backend
npm run build
npm run openapi:generate
```

The file is written to `backend/openapi.json`.

---

## 8. API SDK Generation

After generating `openapi.json` (see section 7), you can produce a typed TypeScript/Axios client SDK automatically:

```bash
cd backend
npm run openapi:sdk
```

This runs the [OpenAPI Generator CLI](https://openapi-generator.tech/) and outputs the SDK to the `sdk/` directory at the project root. The generated client can then be used by the web frontend or any TypeScript consumer.

**Requirements:**

- Java 8+ must be installed (the OpenAPI Generator CLI is a Java application).
- Alternatively, use the Docker-based generator:

  ```bash
  docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli generate \
    -i /local/backend/openapi.json \
    -g typescript-axios \
    -o /local/sdk \
    --skip-validate-spec
  ```

**Usage in a project:**

```typescript
import { ItemsApi, Configuration } from '../sdk';

const config = new Configuration({
  basePath: 'https://api.your-domain.com/api/v1',
  accessToken: 'your-jwt-token',
});

const itemsApi = new ItemsApi(config);
const items = await itemsApi.findAll();
```

---

## 9. iOS Signing Setup

To build the iOS app for distribution, you need to configure code signing.

1. **Copy the ExportOptions template:**

   ```bash
   cp mobile/ios/ExportOptions.plist.example mobile/ios/ExportOptions.plist
   ```

2. **Edit `ExportOptions.plist`** with your values:
   - `teamID` -- your Apple Developer Team ID (found in Apple Developer portal under Membership).
   - `com.example.inventoryApp` -- replace with your app's bundle identifier.
   - `YOUR_PROVISIONING_PROFILE_NAME` -- the name of your provisioning profile from Apple Developer portal.

3. **Configure signing in Xcode:**
   - Open `mobile/ios/Runner.xcworkspace` in Xcode.
   - Select the Runner target and go to Signing & Capabilities.
   - Select your development team and provisioning profile.
   - For distribution, switch to manual signing and select the App Store provisioning profile.

4. **Build and export the archive:**

   ```bash
   cd mobile
   flutter build ios --release \
     --dart-define=API_BASE_URL=https://api.your-domain.com/api/v1

   # Archive via Xcode, or command line:
   xcodebuild -workspace ios/Runner.xcworkspace \
     -scheme Runner \
     -sdk iphoneos \
     -configuration Release \
     archive -archivePath build/Runner.xcarchive

   xcodebuild -exportArchive \
     -archivePath build/Runner.xcarchive \
     -exportOptionsPlist ios/ExportOptions.plist \
     -exportPath build/ios-export
   ```

---

## 10. Build Scripts

Convenience scripts are provided for mobile release builds.

### Android

```bash
# Set the API URL (optional, defaults to https://api.example.com/api/v1)
export API_BASE_URL=https://api.your-domain.com/api/v1

# Run the build script
./mobile/scripts/build-android.sh
```

Output: `mobile/build/app/outputs/bundle/release/app-release.aab`

### iOS

```bash
export API_BASE_URL=https://api.your-domain.com/api/v1

./mobile/scripts/build-ios.sh
```

Output: `mobile/build/ios/iphoneos/Runner.app`

After the iOS build completes, create an IPA using `xcodebuild -exportArchive` (see iOS Signing Setup above).

---

## 11. Vercel Environment Variables

When deploying the web frontend to Vercel, configure the following environment variables in the Vercel project dashboard (Settings > Environment Variables):

| Variable               | Required | Example                                       | Description                          |
| ---------------------- | -------- | --------------------------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_API_URL`  | Yes      | `https://api.your-domain.com/api/v1`          | Backend API base URL                 |

The `web/vercel.json` file configures:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

For self-hosted deployments, the `next.config.js` includes `output: 'standalone'` which produces a minimal standalone Node.js server in `.next/standalone`. You can deploy this directory without the full `node_modules`:

```bash
cd web
npm run build:static
# The output is in .next/standalone
node .next/standalone/server.js
```

---

## 12. Troubleshooting

### Backend will not start

- **"MISSING ENVIRONMENT VARIABLES"** -- Set `DATABASE_URL` and `JWT_SECRET` in your `.env` file. See the reference table above.
- **Database connection refused** -- Ensure PostgreSQL is running and the `DATABASE_URL` host/port are correct. If using Docker, make sure the `postgres` container is healthy: `docker compose -f docker-compose.prod.yml ps`.
- **Port already in use** -- Change `PORT` in `.env` or stop the conflicting process.

### Database migrations fail

- **"Migration not found"** -- Run `npx prisma generate` first, then `npm run migration:run`.
- **Permission denied** -- Ensure the database user in `DATABASE_URL` has `CREATE` / `ALTER` privileges.
- **Dirty migration state** -- Check status with `npm run migration:status`. If stuck, you may need to manually resolve or reset with `npm run migration:revert` (this destroys data).

### Docker issues

- **Build fails at `npm ci`** -- Ensure `package-lock.json` is committed and up to date.
- **Container exits immediately** -- Check logs: `docker compose -f docker-compose.prod.yml logs backend`.
- **Health check failing** -- The health endpoint is `GET /api/v1/health`. Ensure the backend has finished starting (check `start_period` in the health check config).

### Web frontend

- **API requests fail with CORS error** -- Add your frontend URL to `CORS_ORIGIN` in the backend `.env`.
- **Vercel build fails** -- Ensure `web/package.json` has all dependencies and the `build` script works locally.

### Mobile

- **Android signing error** -- Verify `key.properties` values match your keystore. Ensure the keystore file path is absolute.
- **API connection timeout on device** -- `localhost` will not work on a real device. Use your machine's IP or a deployed backend URL via `--dart-define=API_BASE_URL=...`.
