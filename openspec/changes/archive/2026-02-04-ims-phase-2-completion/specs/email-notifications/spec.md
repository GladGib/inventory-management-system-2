## ADDED Requirements

### Requirement: Purchase order email to vendor
The system SHALL allow users to send purchase orders to vendors via email.

#### Scenario: Send PO email
- **WHEN** user clicks "Send to Vendor" on a confirmed purchase order
- **THEN** system sends email to vendor's primary email address
- **AND** attaches PO PDF document
- **AND** records email sent timestamp on the PO

#### Scenario: PO email content
- **WHEN** PO email is sent
- **THEN** email subject contains PO number and organization name
- **AND** email body includes order summary and delivery instructions
- **AND** vendor contact information is used for recipient

#### Scenario: Vendor without email address
- **WHEN** user attempts to email PO to vendor without email
- **THEN** system shows error "Vendor has no email address configured"

### Requirement: Invoice email to customer
The system SHALL allow users to send invoices to customers via email.

#### Scenario: Send invoice email
- **WHEN** user clicks "Send to Customer" on an invoice
- **THEN** system sends email to customer's billing email address
- **AND** attaches invoice PDF document
- **AND** records email sent timestamp on the invoice

#### Scenario: Invoice email content
- **WHEN** invoice email is sent
- **THEN** email subject contains invoice number and amount due
- **AND** email body includes payment terms and bank details
- **AND** due date is prominently displayed

#### Scenario: Resend invoice email
- **WHEN** user sends invoice email that was previously sent
- **THEN** system sends the email again
- **AND** updates the last sent timestamp

### Requirement: Email templates
The system SHALL use customizable email templates for all automated emails.

#### Scenario: Template variable substitution
- **WHEN** email is generated from template
- **THEN** system replaces variables like {{customer_name}}, {{invoice_number}}, {{amount}}
- **AND** handles missing optional variables gracefully

#### Scenario: Organization branding in emails
- **WHEN** email is generated
- **THEN** email header includes organization logo if configured
- **AND** footer includes organization name and contact information

### Requirement: Email delivery tracking
The system SHALL track email delivery status for audit purposes.

#### Scenario: Email send logging
- **WHEN** email is sent
- **THEN** system logs recipient, subject, timestamp, and status
- **AND** log is viewable in document history

#### Scenario: Email delivery failure handling
- **WHEN** email fails to send (SMTP error)
- **THEN** system logs the failure with error details
- **AND** notifies user of the failure
- **AND** allows retry

### Requirement: Email configuration
The system SHALL allow administrators to configure email settings.

#### Scenario: SMTP configuration
- **WHEN** admin configures email settings
- **THEN** system stores SMTP host, port, username, password, and TLS setting
- **AND** validates connection before saving

#### Scenario: Email connection test
- **WHEN** admin clicks "Test Connection"
- **THEN** system attempts to connect to SMTP server
- **AND** reports success or detailed error message
