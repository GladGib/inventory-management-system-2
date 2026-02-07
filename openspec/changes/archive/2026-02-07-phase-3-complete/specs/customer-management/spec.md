## ADDED Requirements

### Requirement: Customer CSV bulk import
Customers SHALL be importable via CSV upload with validation and atomic transaction handling.

#### Scenario: Import customers endpoint
- **WHEN** POST /api/customers/import with CSV file
- **THEN** customers are validated, created in transaction, results returned

#### Scenario: Email validation during import
- **WHEN** CSV contains invalid or duplicate emails
- **THEN** validation errors returned for those rows, no customers imported

#### Scenario: Download customer import template
- **WHEN** GET /api/customers/import/template
- **THEN** CSV template file with headers and sample row is downloaded

#### Scenario: Address parsing in import
- **WHEN** CSV contains address columns (street, city, state, zip, country)
- **THEN** addresses are parsed and stored correctly for each customer
