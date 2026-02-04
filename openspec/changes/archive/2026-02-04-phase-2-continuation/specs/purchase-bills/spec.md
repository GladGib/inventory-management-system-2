## ADDED Requirements

### Requirement: Create bill from GRN
The system SHALL allow users to create a purchase bill from a completed goods received note.

#### Scenario: Create bill from single GRN
- **WHEN** user creates bill from a GRN
- **THEN** system creates bill with items and amounts from GRN

#### Scenario: Create bill from multiple GRNs
- **WHEN** user selects multiple GRNs from same vendor
- **THEN** system creates consolidated bill with all items

#### Scenario: Prevent duplicate billing
- **WHEN** user attempts to create bill for already-billed GRN
- **THEN** system rejects with error indicating GRN is already billed

### Requirement: Bill creation form in web UI
The web application SHALL provide a form to create bills from GRNs.

#### Scenario: Select GRNs for billing
- **WHEN** user navigates to bill creation page
- **THEN** system displays unbilled GRNs for selection

#### Scenario: Submit bill creation
- **WHEN** user selects GRNs and submits
- **THEN** system creates bill and navigates to bill detail page

### Requirement: Payment recording modal
The web application SHALL provide a modal to record payments against bills.

#### Scenario: Record full payment
- **WHEN** user records payment equal to bill balance
- **THEN** system records payment and marks bill as paid

#### Scenario: Record partial payment
- **WHEN** user records payment less than bill balance
- **THEN** system records payment and updates remaining balance

#### Scenario: Payment validation
- **WHEN** user attempts to record payment exceeding balance
- **THEN** system rejects with validation error

### Requirement: Payments made list page
The web application SHALL display a list of all payments made to vendors.

#### Scenario: View payments list
- **WHEN** user navigates to payments made page
- **THEN** system displays list of payments with vendor, date, amount, and bill reference

#### Scenario: Filter payments
- **WHEN** user filters by vendor or date range
- **THEN** system displays filtered payment list
