## ADDED Requirements

### Requirement: Vendor CRUD operations
The system SHALL allow users to create, read, update, and soft delete vendors.

#### Scenario: Create vendor
- **WHEN** user creates vendor with company name, contact person, email, and phone
- **THEN** system generates vendor code, saves record, and returns vendor with ID

#### Scenario: List vendors
- **WHEN** user calls GET /vendors
- **THEN** system returns paginated list of active vendors

#### Scenario: Search vendors
- **WHEN** user calls GET /vendors?search=parts
- **THEN** system returns vendors matching search term in name, code, or contact person

#### Scenario: Get vendor by ID
- **WHEN** user calls GET /vendors/:id
- **THEN** system returns vendor details including addresses and outstanding bills

#### Scenario: Update vendor
- **WHEN** user updates vendor details
- **THEN** system saves changes and returns updated vendor

#### Scenario: Delete vendor
- **WHEN** user deletes vendor
- **THEN** system soft deletes; vendor retained for transaction history

### Requirement: Vendor code generation
The system SHALL auto-generate unique vendor codes with configurable prefix (default: VEND-XXXXX).

#### Scenario: Auto-generate code
- **WHEN** user creates vendor without specifying code
- **THEN** system generates code like "VEND-00001"

### Requirement: Multiple vendor addresses
The system SHALL support multiple addresses per vendor with one designated as default.

#### Scenario: Add address
- **WHEN** user adds address to vendor
- **THEN** system saves address linked to vendor

#### Scenario: Set default address
- **WHEN** user sets address as default
- **THEN** that address auto-populates on purchase orders

### Requirement: Vendor payment terms
The system SHALL allow setting default payment terms per vendor (e.g., Net 30, COD).

#### Scenario: Set payment terms
- **WHEN** user sets vendor payment terms to "Net 60"
- **THEN** bills from this vendor default to 60-day due date

### Requirement: Vendor tax registration
The system SHALL store vendor's tax registration number for tax compliance.

#### Scenario: Store tax registration
- **WHEN** user enters tax registration number for vendor
- **THEN** system saves and uses for tax reporting

### Requirement: Vendor bank details
The system SHALL store vendor's bank account details for payment processing.

#### Scenario: Store bank details
- **WHEN** user enters bank name, account number, and account name for vendor
- **THEN** system saves details for reference during payments

### Requirement: Vendor currency
The system SHALL store preferred currency per vendor for multi-currency support (Phase 3).

#### Scenario: Set vendor currency
- **WHEN** user sets vendor currency to USD
- **THEN** system stores currency for future PO generation

### Requirement: Vendor preferred items
The system SHALL allow linking vendors to items they supply, with vendor-specific pricing and lead time.

#### Scenario: Link item to vendor
- **WHEN** user adds item to vendor's catalog with price RM 50 and lead time 7 days
- **THEN** system stores vendor-item relationship

#### Scenario: View vendor items
- **WHEN** user calls GET /vendors/:id/items
- **THEN** system returns items supplied by this vendor with vendor pricing

#### Scenario: Suggest vendor for item
- **WHEN** user views item's preferred vendor
- **THEN** system shows vendor with best price or fastest lead time

### Requirement: Vendor transaction history
The system SHALL provide access to vendor's transaction history including POs, GRNs, bills, and payments.

#### Scenario: View transaction history
- **WHEN** user calls GET /vendors/:id/transactions
- **THEN** system returns paginated list of purchase orders, bills, and payments

### Requirement: Vendor outstanding balance
The system SHALL track vendor's outstanding balance (total unpaid bills).

#### Scenario: Calculate outstanding balance
- **WHEN** user views vendor
- **THEN** system calculates sum of unpaid bill amounts

#### Scenario: Balance update on payment
- **WHEN** payment is made to vendor
- **THEN** outstanding balance decreases accordingly

### Requirement: Vendor performance tracking
The system SHALL track basic vendor performance metrics: on-time delivery rate, quality issues.

#### Scenario: Calculate on-time delivery rate
- **WHEN** user views vendor performance
- **THEN** system shows percentage of POs received by expected date

### Requirement: Vendor contact management
The system SHALL allow storing multiple contacts per vendor.

#### Scenario: Add contact
- **WHEN** user adds contact "Sarah - Sales Rep" to vendor
- **THEN** system saves contact linked to vendor

### Requirement: Bulk vendor import
The system SHALL allow importing vendors from CSV file.

#### Scenario: Import vendors
- **WHEN** user uploads valid CSV with vendor data
- **THEN** system creates vendors and returns import summary
