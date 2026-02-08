## Context

Phase 3 implementation reached 114/132 tasks. The remaining 18 tasks are integration work (wiring existing components into pages), mobile integration, FCM setup, API documentation, and deployment verification. All backend APIs and reusable UI components already exist — this is wiring and polish.

**Current state:**
- Web: FileUpload, ImagePreview, VariantForm, VariantList components exist but aren't wired into the item detail page
- Mobile: WarehouseSelectionScreen exists but isn't accessible from the main app bar
- Backend: Notifications module complete, Swagger partially configured, openapi:generate script ready
- Deployment: Dockerfile.prod, docker-compose.prod.yml, vercel.json, DEPLOYMENT.md all exist

## Goals / Non-Goals

**Goals:**
- Complete all 18 remaining Phase 3 tasks (132/132)
- Wire existing components into their target pages
- Make the mobile app fully warehouse-aware
- Produce a complete OpenAPI spec
- Ensure all deployment configs are validated and documented

**Non-Goals:**
- No new backend APIs or services
- No new database models or migrations
- No new reusable components (all already built)
- No redesign of existing UIs — integration only

## Decisions

### 1. Item detail page: Ant Design Tabs
Use `Tabs` from Ant Design to create Details/Images/Variants sections on `items/[id]/page.tsx`. This matches the existing Ant Design patterns used throughout the app. The existing `ItemForm`, `FileUpload`/`ImagePreview`, and `VariantForm`/`VariantList` components slot directly into each tab.

### 2. Sales order variant selection: inline conditional
When a user selects an item in the sales order form, check if `item.type === 'VARIANT_PARENT'`. If so, fetch variants via `GET /api/v1/items/:id/variants` and show a secondary Select dropdown. The selected variant's ID replaces `itemId` on the line. No backend changes needed — the sales service already validates variant selection.

### 3. Mobile warehouse: provider-based filtering
The `selectedWarehouseProvider` already exists. Add a `warehouseId` query parameter to all warehouse-scoped API calls in existing screens. Add a warehouse display chip + change button to `MainScreen`'s AppBar.

### 4. Firebase: placeholder config approach
Since actual Firebase project credentials require external setup, create example config files (`google-services.json.example`, `GoogleService-Info.plist.example`) with the correct structure and clear setup instructions. Add `firebase_core` and `firebase_messaging` to pubspec.yaml. Update `notification_service.dart` to import real FCM packages with conditional compilation guards.

### 5. OpenAPI: generate + commit
Run `npm run openapi:generate` to produce `openapi.json`. Add an `openapi:sdk` script that documents how to use openapi-generator-cli. Commit the generated spec.

### 6. Deployment verification: validate what's runnable
For tasks requiring runtime (Docker, Vercel, Flutter builds): attempt to run them if the tools are available, document the commands regardless. Create build helper scripts (`scripts/build-android.sh`, `scripts/build-ios.sh`). For iOS signing, create template plists with instructions.

## Risks / Trade-offs

- **Firebase without real credentials**: The FCM integration will compile but won't send notifications until real `google-services.json` / `GoogleService-Info.plist` are added. Mitigated by clear setup docs and example files.
- **Docker/Flutter may not be available**: Build verification tasks depend on local tooling. Mitigated by validating configs statically and documenting commands.
- **iOS signing requires Apple Developer account**: Template files created with placeholder values. Mitigated by step-by-step instructions in DEPLOYMENT.md.
