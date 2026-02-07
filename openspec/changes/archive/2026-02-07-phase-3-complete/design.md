## Context

The IMS is at 85% completion with a NestJS backend, Next.js web frontend, and Flutter mobile app. The remaining 28 tasks span file uploads, bulk imports, item variants, mobile features, testing, and deployment preparation. The codebase already has established patterns for services, controllers, DTOs, and React components that new features should follow.

Current state:
- Backend: TypeORM entities, NestJS modules with guards, existing PDF generation service
- Web: Next.js App Router, React Query for data fetching, Tailwind + shadcn/ui components
- Mobile: Flutter with Provider state management, offline storage via SharedPreferences
- Testing: Jest unit tests (328 passing), basic E2E setup with jest-e2e

## Goals / Non-Goals

**Goals:**
- Complete all 28 remaining backlog tasks to 100%
- Maintain consistency with existing code patterns and architecture
- Ensure production-readiness with proper testing and deployment configs
- Keep changes backward-compatible with existing data

**Non-Goals:**
- Major architectural refactoring of existing systems
- Adding features beyond the defined backlog scope
- Cloud-specific deployment (keep it platform-agnostic Docker)
- Real-time sync (existing polling/manual refresh is sufficient)

## Decisions

### D1: File Upload Storage
**Decision**: Local filesystem storage with configurable path, served via static file middleware.
**Rationale**: Simpler than S3 for MVP; can be migrated later. Path configured via environment variable.
**Alternatives considered**: S3/MinIO (added complexity), database blob storage (poor performance).

### D2: Bulk Import Processing
**Decision**: Synchronous processing with streaming CSV parser, transaction-wrapped database inserts.
**Rationale**: Simpler than async queue for expected file sizes (<10MB). Full transaction ensures atomicity.
**Alternatives considered**: Background job queue (unnecessary complexity for expected volumes).

### D3: Item Variants Model
**Decision**: Separate `ItemVariant` entity with foreign key to `Item`, storing variant attributes as JSON.
**Rationale**: Flexible attribute schema, single table for variants, existing pattern in codebase.
**Alternatives considered**: EAV model (complex queries), separate columns per attribute (inflexible).

### D4: Push Notifications
**Decision**: Firebase Cloud Messaging (FCM) for both iOS and Android.
**Rationale**: Industry standard, free tier sufficient, single SDK for both platforms.
**Alternatives considered**: OneSignal (additional vendor), APNs+FCM separate (more complexity).

### D5: E2E Testing Framework
**Decision**: Extend existing Jest E2E setup with test database seeding utilities.
**Rationale**: Already configured, consistent with unit tests, team familiarity.
**Alternatives considered**: Playwright for API tests (overkill), separate test framework (fragmentation).

### D6: Load Testing Tool
**Decision**: k6 for performance and load testing.
**Rationale**: Modern, scriptable in JavaScript, good reporting, runs locally and in CI.
**Alternatives considered**: Artillery (similar but less ecosystem), JMeter (heavy, XML-based).

### D7: Production Container
**Decision**: Multi-stage Dockerfile with Node.js Alpine base, non-root user.
**Rationale**: Small image size, security best practices, standard pattern.
**Alternatives considered**: Distroless (debugging difficulty), full Node image (larger).

### D8: OpenAPI Generation
**Decision**: Use @nestjs/swagger decorators already in codebase, add spec export script.
**Rationale**: Decorators already present, just need to configure export endpoint/file.
**Alternatives considered**: Manual OpenAPI writing (drift risk), alternative generators (non-standard).

## Risks / Trade-offs

### R1: File Storage Scalability
**Risk**: Local storage won't scale for multi-server deployment.
**Mitigation**: Abstract storage behind interface; document S3 migration path. Use shared volume in Docker Compose for now.

### R2: Bulk Import Memory
**Risk**: Large CSV files could exhaust memory.
**Mitigation**: Use streaming parser (csv-parse), process in batches of 100 rows, enforce 10MB file size limit.

### R3: E2E Test Flakiness
**Risk**: E2E tests may be flaky due to timing issues.
**Mitigation**: Use proper wait conditions, retry logic, isolated test database per run.

### R4: Push Notification Delivery
**Risk**: FCM delivery not guaranteed; tokens can expire.
**Mitigation**: Store delivery status, implement token refresh on app launch, graceful degradation.

### R5: Mobile Conflict Resolution
**Risk**: Complex conflicts may need manual intervention.
**Mitigation**: Start with simple last-write-wins for non-critical data; flag true conflicts for manual review.

## Migration Plan

### Phase A (Business Features)
1. Add file upload module and storage configuration
2. Deploy with new environment variables for upload path
3. Add bulk import endpoints (no migration needed)
4. Add item variants table via TypeORM migration

### Phase B (Mobile)
1. Update Flutter app with new screens
2. Configure FCM in Firebase console
3. Gradual rollout via app store updates

### Phase C (Testing)
1. Add E2E test suites to CI pipeline
2. Configure test database in CI environment
3. Add k6 scripts to repository (manual execution initially)

### Phase D (Deployment)
1. Add Dockerfile and docker-compose.prod.yml
2. Document environment variables
3. Create deployment guide

### Rollback Strategy
- Database migrations have down() methods
- Feature flags not needed (additive changes)
- Mobile app backward-compatible with existing API
