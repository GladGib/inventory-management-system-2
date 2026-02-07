## ADDED Requirements

### Requirement: Vendor CSV bulk import
Vendors SHALL be importable via CSV upload with validation and atomic transaction handling.

#### Scenario: Import vendors endpoint
- **WHEN** POST /api/vendors/import with CSV file
- **THEN** vendors are validated, created in transaction, results returned

#### Scenario: Download vendor import template
- **WHEN** GET /api/vendors/import/template
- **THEN** CSV template file with headers and sample row is downloaded

#### Scenario: Lead time default handling
- **WHEN** CSV row has empty lead time
- **THEN** default lead time of 7 days is applied
