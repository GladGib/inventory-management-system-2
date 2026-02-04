## ADDED Requirements

### Requirement: Purchase order email sending
The system SHALL allow sending purchase orders to vendors via email.

#### Scenario: Send PO to vendor
- **WHEN** user clicks "Send to Vendor" on confirmed PO
- **THEN** system sends email to vendor's email address
- **AND** attaches PO PDF document
- **AND** records sent timestamp on PO

#### Scenario: PO email preview
- **WHEN** user initiates PO email
- **THEN** system shows preview with vendor email and message
- **AND** allows editing before sending

#### Scenario: PO email template
- **WHEN** PO email is sent
- **THEN** email uses organization's PO email template
- **AND** includes order details summary in body

#### Scenario: Resend PO email
- **WHEN** user resends previously sent PO
- **THEN** system sends updated email
- **AND** records new sent timestamp

### Requirement: PO email sending UI
The web application SHALL provide UI for sending POs via email.

#### Scenario: Email button on PO detail
- **WHEN** viewing confirmed PO
- **THEN** "Email to Vendor" button is visible
- **AND** button is disabled if vendor has no email

#### Scenario: Email confirmation
- **WHEN** PO email is sent successfully
- **THEN** success message is displayed
- **AND** PO detail shows last sent date
