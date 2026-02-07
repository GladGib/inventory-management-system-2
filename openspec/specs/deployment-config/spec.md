# deployment-config Specification

## Purpose
TBD - created by archiving change phase-3-complete. Update Purpose after archive.
## Requirements
### Requirement: OpenAPI specification generation
The system SHALL generate an OpenAPI 3.0 specification file from the NestJS controllers and DTOs. The spec SHALL be exportable to a JSON/YAML file for client SDK generation.

#### Scenario: Generate OpenAPI spec
- **WHEN** running npm run openapi:generate
- **THEN** openapi.json file is created in project root with all endpoints documented

#### Scenario: Swagger UI available
- **WHEN** accessing /api/docs in development
- **THEN** Swagger UI displays interactive API documentation

#### Scenario: Export for SDK generation
- **WHEN** running openapi-generator with generated spec
- **THEN** TypeScript client SDK is generated successfully

### Requirement: Production Dockerfile
The system SHALL have a multi-stage Dockerfile for building production-ready backend container.

#### Scenario: Build production image
- **WHEN** running docker build -f Dockerfile.prod
- **THEN** image is built with production dependencies only and optimized size

#### Scenario: Non-root user
- **WHEN** container runs
- **THEN** application runs as non-root user for security

#### Scenario: Health check endpoint
- **WHEN** container orchestrator checks health
- **THEN** /health endpoint returns 200 when app is ready

### Requirement: Environment variable configuration
The system SHALL document all required and optional environment variables for production deployment.

#### Scenario: Required variables validation
- **WHEN** app starts without required DATABASE_URL
- **THEN** app fails fast with clear error message listing missing variables

#### Scenario: Production defaults
- **WHEN** NODE_ENV=production
- **THEN** logging level defaults to 'info' and debug endpoints are disabled

### Requirement: Database migration scripts
The system SHALL have production-safe database migration scripts. Migrations SHALL be runnable independently of app startup.

#### Scenario: Run migrations separately
- **WHEN** running npm run migration:run
- **THEN** pending migrations are applied to database

#### Scenario: Migration rollback
- **WHEN** running npm run migration:revert
- **THEN** last migration is rolled back

#### Scenario: Migration status check
- **WHEN** running npm run migration:status
- **THEN** list of pending and applied migrations is displayed

### Requirement: Web deployment configuration
The system SHALL have deployment configuration for Next.js web app. Configuration SHALL support both Vercel and static export hosting.

#### Scenario: Vercel deployment
- **WHEN** pushing to main branch with Vercel integration
- **THEN** app deploys automatically with environment variables from Vercel

#### Scenario: Static export build
- **WHEN** running npm run build:static
- **THEN** static HTML/JS/CSS files are generated in out/ directory

#### Scenario: API URL configuration
- **WHEN** deploying web app
- **THEN** NEXT_PUBLIC_API_URL environment variable configures backend URL

### Requirement: Mobile app build configurations
The system SHALL have build configurations for iOS and Android release builds.

#### Scenario: Android release build
- **WHEN** running flutter build apk --release
- **THEN** signed APK is generated ready for Play Store

#### Scenario: iOS release build
- **WHEN** running flutter build ios --release
- **THEN** IPA is generated ready for App Store

#### Scenario: Environment configuration
- **WHEN** building for production
- **THEN** production API URL and FCM configuration are bundled

### Requirement: Deployment documentation
The system SHALL have comprehensive deployment documentation covering all components.

#### Scenario: Backend deployment guide
- **WHEN** reading deployment docs
- **THEN** step-by-step instructions for Docker deployment are provided

#### Scenario: Database setup guide
- **WHEN** reading deployment docs
- **THEN** PostgreSQL setup and migration instructions are provided

#### Scenario: Environment variable reference
- **WHEN** reading deployment docs
- **THEN** complete list of environment variables with descriptions is provided

#### Scenario: Troubleshooting guide
- **WHEN** deployment issues occur
- **THEN** common issues and solutions are documented

