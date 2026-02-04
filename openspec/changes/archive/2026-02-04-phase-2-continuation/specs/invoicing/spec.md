## ADDED Requirements

### Requirement: Payment receipt PDF generation
The system SHALL generate a printable payment receipt PDF when a customer payment is recorded.

#### Scenario: Generate receipt PDF
- **WHEN** user requests payment receipt PDF
- **THEN** system returns PDF with payment details, customer info, and invoice references

### Requirement: Payments received list page
The web application SHALL display a list of all payments received from customers.

#### Scenario: View payments received list
- **WHEN** user navigates to payments received page
- **THEN** system displays list of payments with customer, date, amount, and invoice reference

#### Scenario: Filter payments by customer
- **WHEN** user filters by customer
- **THEN** system displays filtered payment list for that customer

#### Scenario: Filter payments by date range
- **WHEN** user selects date range filter
- **THEN** system displays payments within the selected range

### Requirement: Invoice email integration
The invoice detail page SHALL integrate with the email sending feature.

#### Scenario: Show send email button
- **WHEN** user views invoice for customer with email
- **THEN** system displays "Send Email" button

#### Scenario: Email confirmation
- **WHEN** email is sent successfully
- **THEN** system displays success message and records send date
