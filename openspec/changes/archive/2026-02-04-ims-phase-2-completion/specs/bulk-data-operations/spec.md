## ADDED Requirements

### Requirement: Bulk item import from CSV
The system SHALL allow users to import multiple items from a CSV file with validation and error reporting.

#### Scenario: Successful bulk import
- **WHEN** user uploads a valid CSV file with item data
- **THEN** system validates all rows and creates items for valid entries
- **AND** returns import summary with success count and any errors

#### Scenario: Dry run validation
- **WHEN** user requests a dry-run import
- **THEN** system validates all rows without creating any items
- **AND** returns detailed validation results for each row

#### Scenario: Partial import with errors
- **WHEN** CSV contains some invalid rows
- **THEN** system imports valid rows and skips invalid ones
- **AND** returns detailed error report with row numbers and error messages

#### Scenario: Duplicate SKU handling
- **WHEN** CSV contains a SKU that already exists in the system
- **THEN** system skips the row and reports "Duplicate SKU" error for that row

#### Scenario: CSV template download
- **WHEN** user requests the item import template
- **THEN** system provides a CSV file with correct headers and example data

### Requirement: Bulk customer import from CSV
The system SHALL allow users to import multiple customers from a CSV file.

#### Scenario: Successful customer import
- **WHEN** user uploads a valid CSV file with customer data
- **THEN** system creates customers for valid entries
- **AND** returns import summary

#### Scenario: Duplicate customer code handling
- **WHEN** CSV contains a customer code that already exists
- **THEN** system skips the row and reports duplicate error

#### Scenario: Required fields validation
- **WHEN** CSV row is missing required fields (name, customer code)
- **THEN** system reports specific missing field errors for that row

### Requirement: Bulk vendor import from CSV
The system SHALL allow users to import multiple vendors from a CSV file.

#### Scenario: Successful vendor import
- **WHEN** user uploads a valid CSV file with vendor data
- **THEN** system creates vendors for valid entries
- **AND** returns import summary

#### Scenario: Vendor code uniqueness
- **WHEN** CSV contains duplicate vendor codes
- **THEN** system imports first occurrence and reports duplicates

### Requirement: Report Excel export
The system SHALL allow users to export report data to Excel format with proper formatting.

#### Scenario: Stock valuation report export
- **WHEN** user clicks export on stock valuation report
- **THEN** system generates Excel file with item details, quantities, and values
- **AND** includes summary totals and report generation timestamp

#### Scenario: Sales by customer report export
- **WHEN** user clicks export on sales by customer report
- **THEN** system generates Excel file with customer sales data
- **AND** includes date range and filter criteria in header

#### Scenario: Excel formatting
- **WHEN** Excel report is generated
- **THEN** numeric columns are formatted as numbers
- **AND** currency columns show MYR symbol with 2 decimal places
- **AND** date columns are formatted as dates
- **AND** headers are bold with background color

### Requirement: Bulk import UI wizard
The web application SHALL provide a step-by-step wizard for bulk import operations.

#### Scenario: File selection step
- **WHEN** user starts bulk import
- **THEN** system shows file upload area with accepted format info
- **AND** provides link to download template

#### Scenario: Column mapping step
- **WHEN** CSV file is uploaded
- **THEN** system shows detected columns and auto-maps to system fields
- **AND** allows user to adjust mappings if needed

#### Scenario: Validation preview step
- **WHEN** mappings are confirmed
- **THEN** system runs dry-run validation
- **AND** shows preview of valid rows and error summary

#### Scenario: Import execution step
- **WHEN** user confirms import after preview
- **THEN** system executes import with progress indicator
- **AND** shows final results with download link for error report
