## ADDED Requirements

### Requirement: Organization profile management
The system SHALL allow administrators to view and update organization profile including company name, logo, address, phone, and email.

#### Scenario: View organization profile
- **WHEN** authenticated user calls GET /organizations/current
- **THEN** system returns organization profile with all fields

#### Scenario: Update organization profile
- **WHEN** administrator updates organization profile via PUT /organizations/current
- **THEN** system saves changes and returns updated profile

#### Scenario: Non-admin update attempt
- **WHEN** non-administrator attempts to update organization profile
- **THEN** system returns HTTP 403 with error message "Insufficient permissions"

### Requirement: Organization logo upload
The system SHALL allow administrators to upload a company logo in PNG, JPG, or SVG format with maximum size of 2MB.

#### Scenario: Valid logo upload
- **WHEN** administrator uploads valid image file under 2MB
- **THEN** system stores image and updates organization logo URL

#### Scenario: Invalid file type
- **WHEN** administrator uploads non-image file
- **THEN** system returns HTTP 400 with error message "Invalid file type"

#### Scenario: File too large
- **WHEN** administrator uploads image larger than 2MB
- **THEN** system returns HTTP 400 with error message "File exceeds maximum size of 2MB"

### Requirement: Tax configuration
The system SHALL allow administrators to configure tax rates for GST/SST compliance. Each tax rate SHALL have a name, rate percentage, and active status.

#### Scenario: Create tax rate
- **WHEN** administrator creates new tax rate with name "SST 10%" and rate 10
- **THEN** system saves tax rate and returns created record with ID

#### Scenario: List tax rates
- **WHEN** user calls GET /settings/tax-rates
- **THEN** system returns all active tax rates for the organization

#### Scenario: Update tax rate
- **WHEN** administrator updates existing tax rate
- **THEN** system saves changes; existing transactions retain original rate

#### Scenario: Deactivate tax rate
- **WHEN** administrator sets tax rate active status to false
- **THEN** tax rate is hidden from selection but retained for historical transactions

### Requirement: Number sequence configuration
The system SHALL maintain auto-incrementing number sequences for document types (SO, PO, INV, GRN, etc.) with configurable prefixes.

#### Scenario: Get next number
- **WHEN** system needs next number for document type "SO" in January 2026
- **THEN** system returns "SO-202601-00001" (or next in sequence)

#### Scenario: Configure prefix
- **WHEN** administrator updates prefix for sales orders to "SALE"
- **THEN** new sales orders use format "SALE-202601-XXXXX"

#### Scenario: Monthly sequence reset
- **WHEN** new month begins
- **THEN** sequence resets to 00001 for that month

### Requirement: Fiscal year settings
The system SHALL allow administrators to configure the organization's fiscal year start month.

#### Scenario: Set fiscal year
- **WHEN** administrator sets fiscal year start to April
- **THEN** system uses April-March for fiscal year calculations in reports

### Requirement: Base currency configuration
The system SHALL store the organization's base currency (default: MYR) which is set during initial setup and cannot be changed.

#### Scenario: View base currency
- **WHEN** user views organization settings
- **THEN** system displays base currency as read-only field

### Requirement: Business address management
The system SHALL store the organization's business address including street, city, state, postal code, and country.

#### Scenario: Update business address
- **WHEN** administrator updates business address
- **THEN** system saves address and uses it on generated documents (invoices, POs)

### Requirement: Organization settings audit trail
The system SHALL log all changes to organization settings with timestamp, user, and before/after values.

#### Scenario: Settings change logged
- **WHEN** administrator changes any organization setting
- **THEN** system creates audit log entry with changed fields and values
