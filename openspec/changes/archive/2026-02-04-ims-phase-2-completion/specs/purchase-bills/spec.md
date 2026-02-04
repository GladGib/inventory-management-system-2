## ADDED Requirements

### Requirement: Bill creation from GRN
The system SHALL allow creating purchase bills from goods received notes.

#### Scenario: Create bill from GRN
- **WHEN** user clicks "Create Bill" on a confirmed GRN
- **THEN** system pre-fills bill with GRN items and quantities
- **AND** user can enter vendor invoice number and bill date

#### Scenario: Bill pricing from PO
- **WHEN** bill is created from GRN linked to PO
- **THEN** item prices default to PO prices
- **AND** user can adjust prices if vendor invoice differs

#### Scenario: Partial billing
- **WHEN** GRN has items not yet billed
- **THEN** user can create bill for subset of items
- **AND** remaining items can be billed later

### Requirement: Payment recording for bills
The system SHALL support recording payments made to vendors.

#### Scenario: Record payment on bill
- **WHEN** user records payment on a bill
- **THEN** system records amount, date, payment method, reference
- **AND** updates bill paid amount and balance

#### Scenario: Full payment
- **WHEN** payment equals remaining balance
- **THEN** bill status changes to PAID
- **AND** bill is marked as fully settled

#### Scenario: Partial payment
- **WHEN** payment is less than remaining balance
- **THEN** bill status changes to PARTIALLY_PAID
- **AND** remaining balance is updated

#### Scenario: Overpayment prevention
- **WHEN** user enters payment exceeding balance
- **THEN** system shows error and prevents submission

### Requirement: Payments made list
The web application SHALL provide a list view of all payments made to vendors.

#### Scenario: Payments made list view
- **WHEN** user navigates to payments made
- **THEN** system displays paginated list of vendor payments
- **AND** shows date, amount, vendor, bill reference, method

#### Scenario: Filter vendor payments
- **WHEN** user applies filters
- **THEN** list can be filtered by date range, vendor, payment method
- **AND** results update immediately

#### Scenario: Payment details
- **WHEN** user clicks a payment
- **THEN** system shows payment details with link to bill

### Requirement: Vendor credit notes handling
The system SHALL support vendor credit notes for purchase returns.

#### Scenario: Record vendor credit note
- **WHEN** vendor issues credit note
- **THEN** user can record credit note with amount and reference
- **AND** credit is available for bill payment

#### Scenario: Apply vendor credit to bill
- **WHEN** user pays bill and vendor credit exists
- **THEN** system allows applying credit to reduce payment
- **AND** records credit application

#### Scenario: Vendor credit balance
- **WHEN** vendor has unused credit
- **THEN** credit balance shows on vendor detail
- **AND** available when paying that vendor's bills

### Requirement: Payment recording UI
The web application SHALL provide a modal for recording bill payments.

#### Scenario: Payment modal
- **WHEN** user clicks "Record Payment" on bill
- **THEN** modal shows bill amount due
- **AND** provides fields for amount, date, method, reference

#### Scenario: Payment method selection
- **WHEN** user records payment
- **THEN** dropdown includes Cash, Bank Transfer, Check, etc.
- **AND** method is required field

#### Scenario: Payment confirmation
- **WHEN** payment is recorded successfully
- **THEN** modal closes and bill detail refreshes
- **AND** success message is displayed

### Requirement: Bill creation UI
The web application SHALL provide UI for creating bills from GRNs.

#### Scenario: Bill creation form
- **WHEN** user creates bill from GRN
- **THEN** form shows pre-filled items from GRN
- **AND** allows entering vendor invoice details

#### Scenario: Price adjustment
- **WHEN** creating bill
- **THEN** user can adjust unit prices per item
- **AND** total recalculates automatically

#### Scenario: Bill submission
- **WHEN** user submits bill
- **THEN** system validates required fields
- **AND** creates bill linked to GRN
