## ADDED Requirements

### Requirement: Return creation from invoice
The system SHALL allow creating sales returns directly from invoices.

#### Scenario: Create return from invoice
- **WHEN** user clicks "Create Return" on an invoice
- **THEN** system pre-fills return with invoice items and quantities
- **AND** user can adjust quantities and select return reason

#### Scenario: Partial return from invoice
- **WHEN** user creates return for some items on invoice
- **THEN** system creates return with specified items and quantities
- **AND** invoice remains unchanged until credit note is applied

#### Scenario: Return reason selection
- **WHEN** creating return
- **THEN** user must select reason (Defective, Wrong Item, Customer Changed Mind, etc.)
- **AND** reason is recorded for reporting purposes

### Requirement: Return inspection workflow
The system SHALL support an inspection workflow for returned items.

#### Scenario: Pending inspection status
- **WHEN** return is created
- **THEN** return status is PENDING_INSPECTION
- **AND** items await physical inspection

#### Scenario: Approve return after inspection
- **WHEN** inspector approves return
- **THEN** system updates status to APPROVED
- **AND** items can be restocked or written off
- **AND** credit note can be generated

#### Scenario: Reject return after inspection
- **WHEN** inspector rejects return
- **THEN** system updates status to REJECTED
- **AND** records rejection reason
- **AND** no credit note is generated

#### Scenario: Partial approval
- **WHEN** inspector approves some items and rejects others
- **THEN** system records disposition for each item
- **AND** credit note reflects only approved items

### Requirement: Credit note generation
The system SHALL generate credit notes for approved returns.

#### Scenario: Generate credit note from return
- **WHEN** return is approved
- **THEN** user can generate credit note
- **AND** credit note references the return and original invoice

#### Scenario: Credit note calculation
- **WHEN** credit note is generated
- **THEN** amount equals returned item values at original invoice prices
- **AND** includes any applicable taxes

#### Scenario: Credit note PDF
- **WHEN** credit note is generated
- **THEN** system can generate credit note PDF
- **AND** PDF includes return details, items, and credit amount

### Requirement: Credit note application
The system SHALL allow applying credit notes to customer invoices.

#### Scenario: Apply credit to invoice
- **WHEN** user applies credit note to an unpaid invoice
- **THEN** system reduces invoice balance by credit amount
- **AND** records the application for audit trail

#### Scenario: Partial credit application
- **WHEN** credit note amount exceeds invoice balance
- **THEN** system applies only needed amount
- **AND** remaining credit stays available

#### Scenario: Credit note refund
- **WHEN** user issues refund for credit note
- **THEN** system records cash refund
- **AND** credit note balance becomes zero

### Requirement: Return inspection workflow UI
The web application SHALL provide UI for the return inspection process.

#### Scenario: Inspection screen
- **WHEN** user opens return in PENDING_INSPECTION status
- **THEN** system shows items with inspection checkboxes
- **AND** provides fields for notes per item

#### Scenario: Disposition selection
- **WHEN** inspector approves item
- **THEN** user selects disposition (Restock, Write Off, Repair)
- **AND** disposition affects inventory handling

#### Scenario: Inspection completion
- **WHEN** all items are inspected
- **THEN** user can complete inspection
- **AND** system updates return status based on results

### Requirement: Credit note view and print
The web application SHALL provide credit note viewing and printing.

#### Scenario: Credit note detail view
- **WHEN** user views credit note
- **THEN** system shows all credit note details
- **AND** displays application history

#### Scenario: Print credit note
- **WHEN** user prints credit note
- **THEN** system generates formatted PDF
- **AND** opens print dialog
