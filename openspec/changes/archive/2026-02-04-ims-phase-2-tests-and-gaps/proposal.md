## Why

The IMS Phase 2 implementation is 44% complete with 75 remaining tasks. The codebase lacks comprehensive unit tests for most services and has no E2E testing infrastructure. Additionally, several web workflow gaps exist (GRN creation UI, bill payment modal, stock count entry). This change completes the testing foundation and fills critical workflow gaps to achieve production readiness.

## What Changes

- Add unit tests for remaining backend services (customers, vendors, warehouses, invoicing, stock management)
- Implement E2E testing infrastructure with test database
- Complete web workflow gaps:
  - Stock count entry and variance review functionality
  - Bill payment recording modal
  - Report PDF/Excel export buttons
- Add missing backend endpoints for email sending (PO and invoice emails)

## Capabilities

### New Capabilities
- `testing-infrastructure`: E2E testing setup with test database, fixtures, and workflow tests
- `report-exports`: PDF and Excel export functionality for all reports

### Modified Capabilities
- None (implementation improvements only, no spec-level requirement changes)

## Impact

- **Backend**: New test files in `src/modules/*/`, E2E test files in `test/`, email endpoints in controllers
- **Web**: Updates to reports pages, bills detail page, stock counts pages
- **Dependencies**: Jest E2E configuration, supertest package
- **Database**: Test database configuration for E2E tests
