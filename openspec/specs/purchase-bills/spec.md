## ADDED Requirements

### Requirement: Purchase bill creation
The system SHALL allow creating bills from goods received notes or directly for non-inventory purchases.

#### Scenario: Create bill from GRN
- **WHEN** user creates bill from GRN
- **THEN** system pre-fills vendor, items, and amounts from GRN

#### Scenario: Create direct bill
- **WHEN** user creates bill without GRN (e.g., for services)
- **THEN** system allows manual entry of vendor and amounts

#### Scenario: Auto-generate bill number
- **WHEN** bill is created
- **THEN** system assigns next number in sequence (e.g., BILL-202601-00001)

### Requirement: Bill line items
The system SHALL support line items with description, quantity, amount, and tax.

#### Scenario: Add line item
- **WHEN** user adds line with quantity 100 and price RM 10
- **THEN** system calculates line total as RM 1000

#### Scenario: Apply tax
- **WHEN** line has 10% tax
- **THEN** system calculates tax amount

### Requirement: Bill matching
The system SHALL support three-way matching: PO quantity, GRN quantity, Bill amount.

#### Scenario: Match bill to PO/GRN
- **WHEN** user creates bill from GRN
- **THEN** system shows PO ordered qty, GRN received qty, and bill amount for comparison

#### Scenario: Price variance detection
- **WHEN** bill price differs from PO price
- **THEN** system highlights variance and requires confirmation

### Requirement: Bill due date calculation
The system SHALL calculate due date based on vendor's payment terms.

#### Scenario: Net 60 terms
- **WHEN** bill date is Jan 1 and vendor has Net 60 terms
- **THEN** due date is Mar 2

### Requirement: Bill status management
The system SHALL track bill status: Draft, Pending, Partially Paid, Paid, Overdue.

#### Scenario: Initial status
- **WHEN** bill is created
- **THEN** status is Draft

#### Scenario: Submit bill
- **WHEN** user submits bill for payment
- **THEN** status changes to Pending

#### Scenario: Overdue detection
- **WHEN** due date passes and balance remains
- **THEN** status changes to Overdue

### Requirement: Bill payment recording
The system SHALL allow recording payments against bills.

#### Scenario: Record full payment
- **WHEN** user records payment of RM 5000 against RM 5000 bill
- **THEN** bill status changes to Paid

#### Scenario: Record partial payment
- **WHEN** user records payment of RM 2000 against RM 5000 bill
- **THEN** bill status changes to Partially Paid, balance shows RM 3000

### Requirement: Multiple payment methods
The system SHALL support payment methods: Bank Transfer, Cheque, Cash.

#### Scenario: Record bank transfer
- **WHEN** user records bank transfer payment
- **THEN** system saves bank reference number

#### Scenario: Record cheque payment
- **WHEN** user records cheque payment
- **THEN** system saves cheque number, date, and bank

### Requirement: Bill listing and filtering
The system SHALL provide list view with filters for status, vendor, and date range.

#### Scenario: List unpaid bills
- **WHEN** user calls GET /bills?status=pending
- **THEN** system returns unpaid bills

#### Scenario: Filter by vendor
- **WHEN** user calls GET /bills?vendor_id=123
- **THEN** system returns bills for that vendor

### Requirement: Bill aging report
The system SHALL calculate bill aging for payables tracking.

#### Scenario: Calculate aging
- **WHEN** user views bill aging
- **THEN** system shows buckets: Current, 1-30 days, 31-60 days, 61-90 days, 90+ days

### Requirement: Vendor reference storage
The system SHALL store vendor's invoice number for reconciliation.

#### Scenario: Store vendor invoice number
- **WHEN** user enters vendor invoice "VINV-2026-456"
- **THEN** reference is stored and searchable

### Requirement: Bill document attachment
The system SHALL allow attaching vendor invoice document to bill.

#### Scenario: Attach vendor invoice
- **WHEN** user uploads scan of vendor invoice
- **THEN** file is attached to bill record

### Requirement: Bill voiding
The system SHALL allow voiding bills that have not been paid.

#### Scenario: Void bill
- **WHEN** user voids unpaid bill
- **THEN** bill status changes to Void

#### Scenario: Void paid bill
- **WHEN** user attempts to void bill with payments
- **THEN** system returns error "Cannot void bill with payments"

### Requirement: Vendor credit notes
The system SHALL support recording vendor credit notes to reduce payables.

#### Scenario: Record vendor credit
- **WHEN** vendor issues credit note for RM 500
- **THEN** system creates credit that can be applied to bills

#### Scenario: Apply credit to bill
- **WHEN** user applies RM 500 credit to RM 2000 bill
- **THEN** bill balance reduces to RM 1500

### Requirement: Bill duplicate detection
The system SHALL warn when creating bill with same vendor invoice number.

#### Scenario: Duplicate warning
- **WHEN** user creates bill with vendor invoice number already recorded
- **THEN** system warns "Bill with this vendor invoice already exists"

### Requirement: Scheduled payment planning
The system SHALL allow scheduling bill payments for cash flow planning.

#### Scenario: Schedule payment
- **WHEN** user schedules bill payment for Jan 15
- **THEN** system shows in payment schedule report
