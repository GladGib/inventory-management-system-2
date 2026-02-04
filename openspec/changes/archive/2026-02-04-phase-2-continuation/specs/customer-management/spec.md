## ADDED Requirements

### Requirement: Customer details page with transactions
The web application SHALL provide a customer details page showing all transactions.

#### Scenario: View customer details
- **WHEN** user navigates to customer detail page
- **THEN** system displays customer information, contact details, and statistics

#### Scenario: View customer transactions
- **WHEN** user views customer details
- **THEN** system displays list of orders, invoices, payments, and returns for that customer

#### Scenario: View customer balance
- **WHEN** user views customer details
- **THEN** system displays outstanding balance (total invoices minus payments and credits)

### Requirement: Customer addresses management UI
The web application SHALL allow users to manage multiple addresses per customer.

#### Scenario: Add customer address
- **WHEN** user adds new address to customer
- **THEN** system saves address with type (billing, shipping, both)

#### Scenario: Set default address
- **WHEN** user sets address as default
- **THEN** system marks address as default for its type

#### Scenario: Edit customer address
- **WHEN** user updates address details
- **THEN** system saves changes

#### Scenario: Remove customer address
- **WHEN** user deletes address
- **THEN** system removes address (if not used in transactions)

### Requirement: Customer statement view and print
The web application SHALL generate customer account statements.

#### Scenario: View customer statement
- **WHEN** user requests customer statement
- **THEN** system displays statement with transactions and running balance

#### Scenario: Filter statement by date range
- **WHEN** user selects date range for statement
- **THEN** system displays transactions within that period

#### Scenario: Print customer statement
- **WHEN** user prints statement
- **THEN** system generates printable PDF statement
