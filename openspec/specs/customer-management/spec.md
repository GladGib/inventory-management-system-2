## Purpose

Manage customer records including contact details, credit limits, payment terms, addresses, and transaction history for sales operations.
## Requirements
### Requirement: Customer CRUD operations
The system SHALL allow users to create, read, update, and soft delete customers.

#### Scenario: Create customer
- **WHEN** user creates customer with company name, contact person, email, and phone
- **THEN** system generates customer code, saves record, and returns customer with ID

#### Scenario: List customers
- **WHEN** user calls GET /customers
- **THEN** system returns paginated list of active customers

#### Scenario: Search customers
- **WHEN** user calls GET /customers?search=abc
- **THEN** system returns customers matching search term in name, code, or contact person

#### Scenario: Get customer by ID
- **WHEN** user calls GET /customers/:id
- **THEN** system returns customer details including addresses and outstanding balance

#### Scenario: Update customer
- **WHEN** user updates customer details
- **THEN** system saves changes and returns updated customer

#### Scenario: Delete customer
- **WHEN** user deletes customer
- **THEN** system soft deletes (sets deleted_at); customer retained for transaction history

### Requirement: Customer code generation
The system SHALL auto-generate unique customer codes with configurable prefix (default: CUST-XXXXX).

#### Scenario: Auto-generate code
- **WHEN** user creates customer without specifying code
- **THEN** system generates code like "CUST-00001"

#### Scenario: Custom code
- **WHEN** user creates customer with custom code "VIP-001"
- **THEN** system uses provided code if unique

### Requirement: Multiple customer addresses
The system SHALL support multiple addresses per customer with one designated as default billing and one as default shipping.

#### Scenario: Add address
- **WHEN** user adds address to customer
- **THEN** system saves address linked to customer

#### Scenario: Set default billing address
- **WHEN** user sets address as default billing
- **THEN** that address auto-populates on invoices

#### Scenario: Set default shipping address
- **WHEN** user sets address as default shipping
- **THEN** that address auto-populates on sales orders

### Requirement: Customer credit limit
The system SHALL allow setting credit limit per customer. System SHALL warn when orders exceed available credit.

#### Scenario: Set credit limit
- **WHEN** administrator sets credit limit of RM 50,000 for customer
- **THEN** system stores credit limit

#### Scenario: Credit limit warning
- **WHEN** sales order would cause outstanding balance to exceed credit limit
- **THEN** system displays warning but allows order with manager approval

#### Scenario: View credit status
- **WHEN** user views customer details
- **THEN** system shows credit limit, outstanding balance, and available credit

### Requirement: Customer payment terms
The system SHALL allow setting default payment terms per customer (e.g., Net 30, COD, Net 60).

#### Scenario: Set payment terms
- **WHEN** user sets customer payment terms to "Net 30"
- **THEN** invoices for this customer default to 30-day due date

### Requirement: Customer tax registration
The system SHALL store customer's tax registration number (SST/GST number) for tax compliance.

#### Scenario: Store tax registration
- **WHEN** user enters tax registration number for customer
- **THEN** system saves and displays on invoices

### Requirement: Customer groups/tiers
The system SHALL support customer grouping for categorization (e.g., Retail, Wholesale, Distributor).

#### Scenario: Assign customer group
- **WHEN** user assigns customer to "Wholesale" group
- **THEN** customer inherits group-level settings (future: price lists)

#### Scenario: List customers by group
- **WHEN** user calls GET /customers?group=wholesale
- **THEN** system returns customers in that group

### Requirement: Customer transaction history
The system SHALL provide access to customer's transaction history including orders, invoices, and payments.

#### Scenario: View transaction history
- **WHEN** user calls GET /customers/:id/transactions
- **THEN** system returns paginated list of sales orders, invoices, and payments

### Requirement: Customer outstanding balance
The system SHALL track and display customer's outstanding balance (total unpaid invoices).

#### Scenario: Calculate outstanding balance
- **WHEN** user views customer
- **THEN** system calculates sum of unpaid invoice amounts

#### Scenario: Balance update on payment
- **WHEN** payment is recorded against customer invoice
- **THEN** outstanding balance decreases accordingly

### Requirement: Customer statement generation
The system SHALL generate customer statements showing all transactions and balances for a date range.

#### Scenario: Generate statement
- **WHEN** user requests statement for customer from Jan 1 to Jan 31
- **THEN** system generates PDF/printable statement with opening balance, transactions, and closing balance

### Requirement: Customer contact management
The system SHALL allow storing multiple contacts per customer with name, phone, email, and role.

#### Scenario: Add contact
- **WHEN** user adds contact "John - Purchasing Manager" to customer
- **THEN** system saves contact linked to customer

#### Scenario: List contacts
- **WHEN** user views customer details
- **THEN** system displays all contacts for that customer

### Requirement: Bulk customer import
The system SHALL allow importing customers from CSV file.

#### Scenario: Import customers
- **WHEN** user uploads valid CSV with customer data
- **THEN** system creates customers and returns import summary

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

