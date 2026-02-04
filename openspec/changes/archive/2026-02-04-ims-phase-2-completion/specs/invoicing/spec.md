## ADDED Requirements

### Requirement: Payment receipt PDF generation
The system SHALL generate payment receipt documents for recorded payments.

#### Scenario: Generate payment receipt
- **WHEN** payment is recorded on an invoice
- **THEN** system can generate payment receipt PDF
- **AND** receipt includes payment details, method, and reference

#### Scenario: Receipt content
- **WHEN** payment receipt is generated
- **THEN** document includes receipt number, payment date, amount
- **AND** references the invoice being paid
- **AND** shows remaining balance if partial payment

### Requirement: Invoice email sending
The system SHALL allow sending invoices to customers via email.

#### Scenario: Send invoice email
- **WHEN** user clicks "Email Invoice" on invoice detail
- **THEN** system sends email to customer with invoice PDF attached
- **AND** records sent timestamp on invoice

#### Scenario: Email preview
- **WHEN** user initiates email sending
- **THEN** system shows preview of email content
- **AND** allows editing subject and message before sending

#### Scenario: Invoice email history
- **WHEN** invoice has been emailed
- **THEN** invoice detail shows email history
- **AND** includes sent date and recipient

### Requirement: Payments received list
The web application SHALL provide a list view of all payments received.

#### Scenario: Payments list view
- **WHEN** user navigates to payments received
- **THEN** system displays paginated list of all payments
- **AND** shows payment date, amount, customer, invoice, method

#### Scenario: Filter payments
- **WHEN** user applies filters
- **THEN** list can be filtered by date range, customer, payment method
- **AND** results update immediately

#### Scenario: Payment search
- **WHEN** user searches payments
- **THEN** system searches by payment reference, invoice number, customer name
- **AND** displays matching results

#### Scenario: Payment details from list
- **WHEN** user clicks a payment in the list
- **THEN** system shows payment details
- **AND** provides link to related invoice

### Requirement: Credit note application to invoices
The system SHALL support applying customer credit notes to reduce invoice balances.

#### Scenario: Apply credit during payment
- **WHEN** user records payment and customer has available credit
- **THEN** system shows available credit amount
- **AND** allows applying credit to reduce payment needed

#### Scenario: View applied credits on invoice
- **WHEN** invoice has credits applied
- **THEN** invoice detail shows credit applications
- **AND** displays original amount, credits, and net balance
