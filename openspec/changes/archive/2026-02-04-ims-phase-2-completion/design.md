## Context

The IMS MVP has core inventory management functionality implemented across backend (NestJS), web (Next.js), and mobile (Flutter) platforms. The system currently handles:
- Authentication and user management
- Item, customer, vendor, and warehouse master data
- Sales orders, invoicing, and basic returns
- Purchase orders, goods receiving, and bills
- Stock management with adjustments and transfers
- Basic reporting

However, 75 tasks remain incomplete for production readiness:
- Missing CRUD workflows (GRN creation forms, bill creation from GRN, return creation from invoice)
- No file upload capability (logos, item images)
- No bulk operations (CSV import, Excel export)
- No email notifications
- Incomplete test coverage
- No deployment infrastructure

**Constraints:**
- Must maintain backward compatibility with existing API contracts
- Malaysian locale requirements (MYR currency, date formats)
- Mobile offline-first architecture must be preserved
- Existing database schema should be extended, not replaced

## Goals / Non-Goals

**Goals:**
- Complete all business workflow UIs (GRN entry, bill creation, return creation, stock count entry)
- Add file upload infrastructure with validation and storage
- Enable bulk data operations for efficiency
- Add email capabilities for business communications
- Achieve reasonable test coverage (unit tests for all services)
- Provide production-ready deployment configuration
- Generate OpenAPI spec for potential third-party integrations

**Non-Goals:**
- Multi-tenancy architecture changes (already supported)
- Real-time collaboration features
- Advanced analytics or BI dashboards
- Third-party accounting system integrations
- Internationalization beyond Malaysian locale
- Payment gateway integrations

## Decisions

### 1. File Upload Strategy

**Decision:** Use Multer with local filesystem storage, abstractable to S3/cloud later.

**Alternatives considered:**
- Direct S3 upload: More complex setup, requires AWS credentials management
- Base64 in database: Poor performance for large files, bloats database
- Cloudinary/external service: Adds external dependency and cost

**Rationale:** Local storage is simplest for initial deployment. The storage interface will be abstracted so cloud storage can be added later without API changes. Files stored in `/uploads/{orgId}/{type}/{filename}`.

### 2. Bulk Import/Export Architecture

**Decision:** Streaming CSV parser with background job processing for imports; in-memory Excel generation for exports.

**Alternatives considered:**
- Synchronous processing: Blocks requests, timeouts on large files
- Queue-based with Redis: Adds infrastructure complexity
- Client-side parsing: Security concerns, inconsistent validation

**Rationale:** Streaming handles large files without memory issues. Background processing with polling provides good UX. Excel exports are typically small enough for synchronous generation.

### 3. Email Service Design

**Decision:** Nodemailer with SMTP configuration, using Handlebars templates.

**Alternatives considered:**
- SendGrid/Mailgun API: External dependency, recurring cost
- AWS SES: Requires AWS setup
- Direct SMTP only: Works but templates needed for professional emails

**Rationale:** SMTP is universal and works with any email provider. Handlebars templates allow customization without code changes. Can migrate to transactional email service later if needed.

### 4. Item Variants Implementation

**Decision:** Separate `item_variants` table with foreign key to items, each variant has own SKU and inventory tracking.

**Alternatives considered:**
- JSON field on items: Harder to query and index
- Flat structure (variants as separate items): Loses relationship, complicates reporting
- EAV (Entity-Attribute-Value): Over-engineered for this use case

**Rationale:** Relational model provides clear querying, maintains inventory per variant, and integrates naturally with existing stock tables.

### 5. Credit Note Workflow

**Decision:** Credit notes as separate documents linked to returns, can be applied to future invoices or refunded.

**Alternatives considered:**
- Negative invoices: Confusing for accounting
- Direct balance adjustment: No audit trail
- Immediate refund only: Inflexible for business needs

**Rationale:** Credit notes are standard accounting practice. Linking to returns maintains audit trail. Application to invoices or cash refund gives flexibility.

### 6. Test Strategy

**Decision:** Unit tests with Jest mocking dependencies; E2E tests with test database using transactions for isolation.

**Alternatives considered:**
- Integration tests only: Slower, harder to isolate failures
- In-memory database for E2E: Behavior differences with PostgreSQL
- Shared test database: Test pollution issues

**Rationale:** Unit tests ensure service logic correctness. E2E with transactions allows realistic testing without data persistence issues.

### 7. Deployment Infrastructure

**Decision:** Docker Compose for development/staging, single Dockerfile for production with multi-stage build.

**Alternatives considered:**
- Kubernetes: Over-engineered for SME target market
- Serverless: Doesn't fit NestJS architecture well
- VM-based: Less portable, harder to reproduce

**Rationale:** Docker provides consistent environments. Multi-stage builds minimize image size. Compose simplifies local development and staging.

## Risks / Trade-offs

### [Risk] File storage fills up disk space
**Mitigation:** Implement file size limits (5MB images, 2MB logos). Add monitoring for disk usage. Document cloud storage migration path.

### [Risk] Bulk imports with bad data corrupt system
**Mitigation:** Dry-run mode validates without committing. Transaction wrapping ensures atomicity. Detailed error reports help users fix issues.

### [Risk] Email delivery failures go unnoticed
**Mitigation:** Log all email attempts with status. Store failed emails for retry. Dashboard shows email delivery stats.

### [Risk] Item variants complicate inventory queries
**Mitigation:** Create database views for aggregated item stock. Index variant lookups. Cache frequently accessed variant data.

### [Risk] Large test suite slows development
**Mitigation:** Parallel test execution. Unit tests run on file change, E2E on commit. CI caches test dependencies.

### [Trade-off] Local file storage vs cloud
Accepting simpler initial setup at cost of manual migration later. Cloud storage abstraction layer minimizes future effort.

### [Trade-off] Synchronous Excel export vs background jobs
Accepting potential timeouts for very large exports in exchange for simpler implementation. Can add background processing if reports grow significantly.

## Migration Plan

### Phase 1: Backend Infrastructure (No breaking changes)
1. Add file upload module with local storage
2. Add bulk operations module
3. Add email module with templates
4. Generate OpenAPI spec
5. Run existing tests to verify no regressions

### Phase 2: Schema Extensions
1. Add `item_variants` table
2. Add `credit_notes` table
3. Add `file_metadata` table
4. Run migrations in transaction
5. Verify existing data integrity

### Phase 3: Service Enhancements
1. Extend items service for variants
2. Extend sales-returns for credit notes
3. Extend invoicing for credit application
4. Add shipment tracking to sales orders
5. Unit test all new functionality

### Phase 4: Frontend Completion
1. Complete web forms (GRN, bills, returns, stock counts)
2. Add file upload UIs
3. Add bulk import wizards
4. Complete detail pages and lists
5. E2E test critical workflows

### Phase 5: Mobile & Deployment
1. Add push notifications
2. Complete remaining mobile screens
3. Add conflict detection
4. Create Docker configuration
5. Write deployment documentation

### Rollback Strategy
- Database migrations are reversible (down migrations provided)
- Feature flags can disable new capabilities if issues found
- API versioning preserves backward compatibility
- Docker images tagged for easy rollback

## Open Questions

1. **Email provider for production**: SMTP server details needed from operations team
2. **File storage location**: Confirm `/uploads` directory or specify cloud bucket
3. **Push notification service**: Firebase vs alternative for Flutter
4. **CI/CD platform**: GitHub Actions vs other (affects deployment scripts)
5. **Production database**: Confirm PostgreSQL hosting (managed vs self-hosted)
