# Phase 3 Polish — Complete All Remaining Tasks

## Problem

Phase 3 implementation reached 114/132 tasks (86%). 18 tasks remain across web UI integration, mobile integration, API documentation, and deployment verification. The project cannot be considered complete until all 132 tasks are done.

## Solution

Complete all 18 remaining tasks to bring the project to 132/132 (100%).

### A. Web UI Integration (4 tasks)

**2.4 — Item image gallery on item edit page**
Refactor `items/[id]/page.tsx` from a simple edit form into a tabbed layout (Details | Images | Variants). Wire up the existing `FileUpload` and `ImagePreview` components to the item images API endpoints.

**6.4 — Variant management tab on item detail page**
Add a Variants tab to the same tabbed layout above. Wire up the existing `VariantForm` and `VariantList` components. Show variant creation for `SIMPLE` items (converting to `VARIANT_PARENT`), and variant listing/editing for existing `VARIANT_PARENT` items.

**6.5 — Variant selection in sales order form**
Update the sales order line item form to detect when a selected item is a `VARIANT_PARENT` and show a variant selector dropdown. The dropdown should load variants via `GET /api/v1/items/:id/variants` and replace the line item's `itemId` with the selected variant's ID.

**6.6 — Variant stock indicators in item list**
Add a "Variants" column or badge to the items list page. For `VARIANT_PARENT` items, show the variant count. Aggregate stock across all variants for display.

### B. Mobile Integration (2 tasks)

**8.4 — Warehouse change option in app header**
Add a warehouse name/icon button to the `MainScreen` app bar that navigates to `WarehouseSelectionScreen` in change mode. Display the current warehouse name in the header.

**8.5 — Filter all queries by selected warehouse**
Pass `selectedWarehouseId` from the warehouse provider into all API calls that are warehouse-scoped: pick lists, goods receiving, stock counts, stock lookups, and item stock queries.

### C. Mobile Push Notifications Setup (3 tasks)

**10.1 — Add firebase_messaging dependency**
Add `firebase_messaging` and `firebase_core` to `pubspec.yaml`. Update the notification service to use real FCM imports instead of placeholders.

**10.2 — Configure FCM in Android**
Add Firebase configuration to `android/app/build.gradle` (Google Services plugin), create `google-services.json.example` with placeholder structure and setup instructions.

**10.3 — Configure FCM in iOS**
Add Firebase configuration to `ios/Runner/Info.plist` for push notification capabilities. Create `GoogleService-Info.plist.example` with placeholder structure and setup instructions.

### D. API Documentation (3 tasks)

**16.2 — Audit and add missing Swagger decorators**
Audit all controllers for missing `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`, and `@ApiBody` decorators. Add decorators to any endpoints that lack them.

**16.4 — Generate and validate openapi.json**
Run `npm run openapi:generate` to produce `openapi.json`. Validate the output is well-formed and contains all endpoints.

**16.5 — Test SDK generation**
Document the SDK generation process using `openapi-generator-cli`. Add an `openapi:sdk` npm script and instructions in DEPLOYMENT.md.

### E. Deployment Verification (6 tasks)

**17.5 — Test production Docker build**
Run `docker build` with Dockerfile.prod if Docker is available. Fix any build issues. If Docker is unavailable, validate the Dockerfile syntax and document the build command.

**18.6 — Test migration scripts**
Run `npm run migration:status` to verify Prisma migration scripts work. Document the migration workflow in DEPLOYMENT.md.

**19.3 — Create static export build script**
Add `build:static` script to `web/package.json`. Configure `next.config.js` with `output: 'standalone'` for self-hosted deployments.

**19.4 — Test Vercel deployment configuration**
Validate `vercel.json` configuration. Run `next build` to verify it produces deployable output. Document Vercel environment variables.

**20.2 — Configure iOS release signing**
Create `ios/ExportOptions.plist` template for iOS distribution. Add iOS build instructions to DEPLOYMENT.md. Create `ios/fastlane/Fastfile.example` if applicable.

**20.4 — Test release builds**
Create build scripts: `scripts/build-android.sh` and `scripts/build-ios.sh` with the flutter build commands. Verify `flutter build apk --release` works if Flutter is available. Document the build process.

## Scope

| Category | Tasks | IDs |
|----------|-------|-----|
| Web UI Integration | 4 | 2.4, 6.4, 6.5, 6.6 |
| Mobile Integration | 2 | 8.4, 8.5 |
| Mobile FCM Setup | 3 | 10.1, 10.2, 10.3 |
| API Documentation | 3 | 16.2, 16.4, 16.5 |
| Deployment Verification | 6 | 17.5, 18.6, 19.3, 19.4, 20.2, 20.4 |
| **Total** | **18** | |

## Outcome

Phase 3 tasks: 132/132 (100%)
Backlog: 123/123 (100%) — already complete
Project status: **Code complete, deployment ready**

## Deltas

- item-management (update: image gallery + variant tabs in item detail page)
- sales-orders (update: variant selection in line items)
- mobile-warehouse (update: warehouse header + query filtering)
- push-notifications (update: FCM dependency and platform config)
- deployment-config (update: static export, iOS signing, build scripts, SDK generation)
