## Context

The IMS backend uses NestJS with modular architecture (`backend/src/modules/`). Each module contains controllers, services, DTOs, and entities. The web frontend is Next.js 14 with App Router (`web/src/app/`). PDF generation uses `pdf.service.ts`. Tests use Jest with separate configs for unit and E2E.

Current state:
- Core CRUD operations exist for all entities
- PDF generation exists for invoices, POs, sales orders, GRNs
- Basic E2E test infrastructure is set up
- Web pages exist but many lack forms/workflows (list views only)

## Goals / Non-Goals

**Goals:**
- Complete all partially-implemented workflows (GRN creation, bill creation, returns, stock counts)
- Add missing PDF generation (delivery orders, payment receipts, credit notes)
- Implement email sending for POs and invoices
- Add comprehensive unit tests for untested services
- Add E2E tests for critical workflows
- Build missing web UI forms and detail pages

**Non-Goals:**
- Bulk import/export (CSV) - deferred to later
- File uploads (logos, item images) - deferred
- Item variants management - deferred
- Mobile app enhancements - deferred
- Deployment/infrastructure - deferred
- Performance optimization - deferred

## Decisions

### 1. Email Service Architecture
**Decision**: Use Nodemailer with configurable SMTP transport, template-based emails using Handlebars.

**Rationale**: Nodemailer is the standard Node.js email library with broad SMTP provider support. Handlebars templates allow HTML emails with variable substitution.

**Alternatives considered**:
- SendGrid SDK: More features but adds vendor lock-in
- AWS SES SDK: Requires AWS infrastructure
- Resend: Newer, less mature ecosystem

### 2. Credit Notes Module
**Decision**: Create a dedicated `credit-notes` module (already scaffolded at `backend/src/modules/credit-notes/`) that handles both sales credit notes (from returns) and vendor credit notes (from purchase returns).

**Rationale**: Credit notes have distinct lifecycle, numbering, and accounting implications that warrant isolation from invoices/bills.

**Alternatives considered**:
- Extend invoices module: Would complicate invoice logic with negative amounts
- Separate sales-credit-notes and vendor-credit-notes: Duplicates shared logic

### 3. Shipment as Sub-entity of Sales Orders
**Decision**: Shipments are created as sub-resources of sales orders (`/sales-orders/:id/shipments`), not a separate module.

**Rationale**: Shipments are tightly coupled to sales orders and don't exist independently. This follows REST resource hierarchy conventions.

**Alternatives considered**:
- Separate `/shipments` module: Loses parent context, complicates authorization

### 4. Web Forms Strategy
**Decision**: Use React Hook Form with Zod validation for all new forms, consistent with existing patterns in the codebase.

**Rationale**: Consistency with existing implementation. Type-safe validation. Good DX with form state management.

### 5. Test Organization
**Decision**: Unit tests co-located with services (`*.service.spec.ts`), E2E tests in `test/` directory (`*.e2e-spec.ts`).

**Rationale**: Follows existing NestJS conventions and current project structure.

## Risks / Trade-offs

### Email Delivery Reliability
**Risk**: SMTP emails may fail or be marked as spam.
**Mitigation**: Implement retry logic, store email status in database, provide manual resend option. Users configure their own SMTP credentials.

### Credit Note Complexity
**Risk**: Credit note application logic (applying to outstanding invoices/bills) has accounting edge cases.
**Mitigation**: Start with simple 1:1 application, log all transactions, allow manual override.

### E2E Test Flakiness
**Risk**: E2E tests may be flaky due to timing, database state.
**Mitigation**: Use test database isolation, explicit waits, clear setup/teardown.

### Form State Management
**Risk**: Complex multi-step forms (count wizard, GRN entry) may have state bugs.
**Mitigation**: Use React Hook Form's built-in state management, add client-side validation at each step.

## Migration Plan

No migrations needed - all changes are additive:
1. New endpoints extend existing modules
2. New web pages don't affect existing routes
3. Tests run independently
4. Email service is opt-in (requires SMTP config)

Rollback: Revert commits. No database schema changes that require migration.

## Open Questions

1. **Email templates**: Should we use plain text fallback or HTML-only?
   - **Resolved**: HTML with plain text fallback for accessibility

2. **Credit note numbering**: Separate sequence or unified with invoices?
   - **Resolved**: Separate sequence (CN-XXXX) for clarity in accounting

3. **Stock count approval workflow**: Single approver or multi-level?
   - **Resolved**: Single approver for MVP, configurable later
