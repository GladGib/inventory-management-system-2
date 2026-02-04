## ADDED Requirements

### Requirement: Email service infrastructure
The system SHALL provide an email service that sends emails via configurable SMTP transport.

#### Scenario: Send email with SMTP configured
- **WHEN** email service is called with valid SMTP configuration
- **THEN** system sends email through configured SMTP server

#### Scenario: Handle missing SMTP configuration
- **WHEN** email service is called without SMTP configuration
- **THEN** system logs warning and skips email sending without error

### Requirement: Send purchase order via email
The system SHALL allow users to email a purchase order PDF to the vendor's email address.

#### Scenario: Send PO email successfully
- **WHEN** user triggers PO email sending for a PO with vendor email
- **THEN** system sends email with PO PDF attachment to vendor email

#### Scenario: Handle vendor without email
- **WHEN** user triggers PO email sending for vendor without email
- **THEN** system returns error indicating vendor email is required

### Requirement: Send invoice via email
The system SHALL allow users to email an invoice PDF to the customer's email address.

#### Scenario: Send invoice email successfully
- **WHEN** user triggers invoice email sending for invoice with customer email
- **THEN** system sends email with invoice PDF attachment to customer email

#### Scenario: Handle customer without email
- **WHEN** user triggers invoice email for customer without email
- **THEN** system returns error indicating customer email is required

### Requirement: PO email sending UI
The web application SHALL provide a button to send PO via email from the PO detail page.

#### Scenario: Send PO email from UI
- **WHEN** user clicks "Send Email" on PO detail page
- **THEN** system sends PO email and displays success notification

### Requirement: Invoice email sending UI
The web application SHALL provide a button to send invoice via email from the invoice detail page.

#### Scenario: Send invoice email from UI
- **WHEN** user clicks "Send Email" on invoice detail page
- **THEN** system sends invoice email and displays success notification
