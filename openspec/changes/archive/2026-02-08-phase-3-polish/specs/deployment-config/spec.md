## ADDED Requirements

### Requirement: Complete Swagger API documentation
All backend API controllers SHALL have comprehensive Swagger decorators including @ApiTags, @ApiOperation, @ApiResponse, @ApiParam, and @ApiBody for every endpoint.

#### Scenario: Generate complete OpenAPI spec
- **WHEN** running npm run openapi:generate
- **THEN** a valid openapi.json file is produced containing all API endpoints with request/response schemas

#### Scenario: SDK generation documentation
- **WHEN** a developer wants to generate a client SDK
- **THEN** DEPLOYMENT.md contains instructions for using openapi-generator-cli with the generated spec

### Requirement: Web static export configuration
The web application SHALL support standalone build output for self-hosted deployments via a build:static npm script.

#### Scenario: Build standalone output
- **WHEN** running npm run build:static
- **THEN** Next.js produces standalone output suitable for deployment without the Next.js server

### Requirement: Production Docker build validation
The production Dockerfile SHALL produce a working container image. The build process SHALL be documented with all required build arguments.

#### Scenario: Docker build succeeds
- **WHEN** running docker build with Dockerfile.prod
- **THEN** the image builds successfully with all dependencies and Prisma client

### Requirement: Migration script validation
The database migration scripts SHALL be verified to work correctly with Prisma migrate commands.

#### Scenario: Migration status check
- **WHEN** running npm run migration:status
- **THEN** the command reports the current migration state without errors

### Requirement: iOS release signing configuration
The mobile app SHALL include iOS signing configuration templates for distribution builds.

#### Scenario: iOS ExportOptions template
- **WHEN** a developer sets up iOS release signing
- **THEN** template plist files and instructions guide the configuration process

### Requirement: Release build scripts
The mobile app SHALL include build scripts for producing release APK/AAB (Android) and IPA (iOS) artifacts.

#### Scenario: Android release build
- **WHEN** running the Android build script
- **THEN** flutter build appbundle --release produces a signed AAB file

#### Scenario: iOS release build
- **WHEN** running the iOS build script
- **THEN** flutter build ios --release produces an IPA for distribution
