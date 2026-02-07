# bulk-import Specification

## Purpose
TBD - created by archiving change phase-3-complete. Update Purpose after archive.
## Requirements
### Requirement: Item CSV bulk import
The system SHALL allow users to import items from a CSV file. The CSV SHALL support columns for: sku, name, description, category, unit, reorderPoint, reorderQty, costPrice, sellingPrice. The system SHALL validate all rows before importing and return detailed error reports.

#### Scenario: Successful item import
- **WHEN** user uploads valid CSV with 50 items via POST /api/items/import
- **THEN** all 50 items are created and response includes count of imported items

#### Scenario: Validation errors reported
- **WHEN** user uploads CSV with invalid data (missing SKU on row 5, invalid price on row 12)
- **THEN** system returns 400 with errors array listing each row's issues without importing any rows

#### Scenario: Duplicate SKU handling
- **WHEN** CSV contains a SKU that already exists in the system
- **THEN** system reports error for that row indicating duplicate SKU

#### Scenario: CSV file size limit
- **WHEN** user uploads CSV larger than 10MB
- **THEN** system returns 400 error with message "File too large. Maximum size: 10MB"

### Requirement: Customer CSV bulk import
The system SHALL allow users to import customers from a CSV file. The CSV SHALL support columns for: name, email, phone, contactPerson, billingAddress, shippingAddress, taxId, creditLimit, paymentTerms.

#### Scenario: Successful customer import
- **WHEN** user uploads valid CSV with 30 customers via POST /api/customers/import
- **THEN** all 30 customers are created and response includes count

#### Scenario: Email uniqueness validation
- **WHEN** CSV contains duplicate emails or email already exists in system
- **THEN** system reports error for those rows without importing any

### Requirement: Vendor CSV bulk import
The system SHALL allow users to import vendors from a CSV file. The CSV SHALL support columns for: name, email, phone, contactPerson, address, taxId, paymentTerms, leadTime.

#### Scenario: Successful vendor import
- **WHEN** user uploads valid CSV with 20 vendors via POST /api/vendors/import
- **THEN** all 20 vendors are created and response includes count

#### Scenario: Partial data handling
- **WHEN** CSV has optional fields left empty
- **THEN** system imports with null/default values for optional fields

### Requirement: Import transaction atomicity
The system SHALL process bulk imports within a database transaction. If any row fails validation, the entire import SHALL be rolled back and no records created.

#### Scenario: Rollback on error
- **WHEN** CSV with 100 rows has error on row 99
- **THEN** no records are created and all errors are reported

### Requirement: Bulk import UI wizard
The web application SHALL provide a bulk import wizard for items, customers, and vendors. The wizard SHALL include steps for: file upload, column mapping preview, validation review, and import confirmation.

#### Scenario: Import wizard flow
- **WHEN** user navigates to Items > Import
- **THEN** wizard displays step 1 with file upload dropzone

#### Scenario: Column mapping preview
- **WHEN** user uploads CSV file
- **THEN** wizard shows preview of first 5 rows with detected column mapping

#### Scenario: Validation preview
- **WHEN** user proceeds to validation step
- **THEN** system shows validation results with error count and success count

#### Scenario: Download sample template
- **WHEN** user clicks "Download Template" in import wizard
- **THEN** browser downloads CSV template with correct headers and sample row

### Requirement: Import progress tracking
The system SHALL display import progress for large files. The UI SHALL show number of rows processed and any errors encountered.

#### Scenario: Progress display
- **WHEN** importing 500 row CSV
- **THEN** UI shows "Processing row X of 500" with progress bar

