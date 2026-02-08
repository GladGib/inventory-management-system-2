# Phase 3 Polish - Implementation Tasks

## 1. Item Detail Page — Tabbed Layout (Web)

- [x] 1.1 Refactor items/[id]/page.tsx to use Ant Design Tabs (Details, Images, Variants)
- [x] 1.2 Wire FileUpload and ImagePreview into the Images tab with item images API
- [x] 1.3 Wire VariantForm and VariantList into the Variants tab with variants API
- [x] 1.4 Add variant count badge and aggregated stock to items list page

## 2. Sales Order Variant Selection (Web)

- [x] 2.1 Add variant detection and selector dropdown to sales order line item form
- [x] 2.2 Replace parent itemId with selected variant itemId in the line item

## 3. Mobile Warehouse Integration

- [x] 3.1 Add warehouse name display and change button to MainScreen app bar
- [x] 3.2 Pass selectedWarehouseId into all warehouse-scoped API calls

## 4. Mobile Firebase Messaging Setup

- [x] 4.1 Add firebase_core and firebase_messaging dependencies to pubspec.yaml
- [x] 4.2 Configure Android build.gradle with Google Services plugin
- [x] 4.3 Create google-services.json.example with placeholder structure
- [x] 4.4 Create iOS push notification entitlements and GoogleService-Info.plist.example
- [x] 4.5 Update notification_service.dart to use real firebase_messaging imports

## 5. Swagger Decorators & OpenAPI Generation (Backend)

- [x] 5.1 Audit all controllers and add missing Swagger decorators
- [x] 5.2 Run openapi:generate and commit openapi.json
- [x] 5.3 Add openapi:sdk script and document SDK generation in DEPLOYMENT.md

## 6. Deployment Verification & Build Scripts

- [x] 6.1 Validate Dockerfile.prod build (run docker build or validate syntax)
- [x] 6.2 Run migration:status to verify Prisma migration scripts
- [x] 6.3 Add build:static script to web/package.json with standalone output config
- [x] 6.4 Validate vercel.json and document Vercel environment variables
- [x] 6.5 Create iOS ExportOptions.plist template and signing instructions
- [x] 6.6 Create scripts/build-android.sh and scripts/build-ios.sh
- [x] 6.7 Update DEPLOYMENT.md with complete build and release instructions
