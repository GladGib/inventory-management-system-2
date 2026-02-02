## ADDED Requirements

### Requirement: Sales return creation
The system SHALL allow creating sales returns (credit notes) against invoices.

#### Scenario: Create sales return
- **WHEN** user creates return referencing invoice
- **THEN** system creates return with items from original invoice

#### Scenario: Select items to return
- **WHEN** user selects specific items and quantities to return
- **THEN** system validates quantities do not exceed invoiced amounts

### Requirement: Sales return number generation
The system SHALL auto-generate return/credit note numbers (e.g., CN-202601-00001).

#### Scenario: Generate return number
- **WHEN** sales return is created
- **THEN** system assigns next number in sequence

### Requirement: Return reason tracking
The system SHALL require a return reason for each returned item.

#### Scenario: Record return reason
- **WHEN** user creates return
- **THEN** system requires selection of reason: Defective, Wrong Item, Customer Changed Mind, Damaged in Transit, Other

### Requirement: Return item inspection
The system SHALL track inspection status of returned items: Pending, Passed, Failed.

#### Scenario: Mark inspection passed
- **WHEN** warehouse inspects returned item and it's in good condition
- **THEN** user marks inspection as Passed, item eligible for restocking

#### Scenario: Mark inspection failed
- **WHEN** returned item is damaged
- **THEN** user marks inspection as Failed, item goes to write-off

### Requirement: Stock return to inventory
The system SHALL return items to inventory when inspection passes.

#### Scenario: Restock returned item
- **WHEN** inspection passes for 5 units
- **THEN** system adds 5 units to warehouse stock

#### Scenario: Specify return bin
- **WHEN** restocking returned items
- **THEN** user can specify bin location for returned stock

### Requirement: Credit note generation
The system SHALL generate credit notes for approved returns.

#### Scenario: Generate credit note
- **WHEN** sales return is approved
- **THEN** system generates credit note PDF with return details

### Requirement: Credit note application
The system SHALL allow applying credit notes to outstanding invoices or customer credit balance.

#### Scenario: Apply to invoice
- **WHEN** user applies RM 500 credit note to RM 1000 invoice
- **THEN** invoice balance reduces to RM 500

#### Scenario: Apply to credit balance
- **WHEN** user adds credit note to customer credit balance
- **THEN** customer's credit balance increases

### Requirement: Refund processing
The system SHALL allow processing refunds for credit notes when customer requests cash/transfer back.

#### Scenario: Process refund
- **WHEN** user records refund of RM 500 to customer
- **THEN** system records refund, reduces credit note balance

### Requirement: Sales return status
The system SHALL track return status: Draft, Pending Inspection, Approved, Completed.

#### Scenario: Status progression
- **WHEN** return is created
- **THEN** status is Draft
- **WHEN** items received for inspection
- **THEN** status is Pending Inspection
- **WHEN** inspection complete and credit note issued
- **THEN** status is Approved
- **WHEN** credit applied or refund processed
- **THEN** status is Completed

### Requirement: Return quantity validation
The system SHALL validate return quantities do not exceed original invoice quantities minus previous returns.

#### Scenario: Exceed quantity check
- **WHEN** user attempts to return 15 units from invoice with 10 units
- **THEN** system returns error "Return quantity exceeds invoiced quantity"

#### Scenario: Previous returns check
- **WHEN** 10 invoiced, 3 previously returned, user tries to return 8
- **THEN** system returns error "Maximum returnable quantity is 7"

### Requirement: Sales return listing
The system SHALL provide list view with filters for status, date range, and customer.

#### Scenario: List pending returns
- **WHEN** user calls GET /sales-returns?status=pending_inspection
- **THEN** system returns all returns awaiting inspection

### Requirement: Return impact on commission
The system SHALL adjust salesperson commission when returns are processed.

#### Scenario: Deduct commission
- **WHEN** return is completed
- **THEN** system notes return value for commission adjustment (Phase 2)

### Requirement: Customer return history
The system SHALL track return history per customer for analysis.

#### Scenario: View customer returns
- **WHEN** user views customer profile
- **THEN** system shows return count and value summary
