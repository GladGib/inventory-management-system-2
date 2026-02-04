## ADDED Requirements

### Requirement: Stock adjustment approval workflow
The web application SHALL provide an approval workflow for stock adjustments.

#### Scenario: Submit adjustment for approval
- **WHEN** user creates stock adjustment
- **THEN** system creates adjustment in pending status for review

#### Scenario: Approve adjustment
- **WHEN** approver reviews and approves adjustment
- **THEN** system applies inventory changes and records approval

#### Scenario: Reject adjustment
- **WHEN** approver rejects adjustment with reason
- **THEN** system marks adjustment as rejected without inventory changes

### Requirement: Stock count creation wizard
The web application SHALL provide a wizard to create new stock count sessions.

#### Scenario: Start count wizard
- **WHEN** user initiates new stock count
- **THEN** system displays wizard with warehouse and scope selection

#### Scenario: Select count scope
- **WHEN** user selects items, categories, or bins to count
- **THEN** system generates count sheet with expected quantities

#### Scenario: Create count session
- **WHEN** user completes wizard
- **THEN** system creates count session with generated count items

### Requirement: Stock count entry form
The web application SHALL provide a form to enter physical count quantities.

#### Scenario: Enter count quantities
- **WHEN** user enters counted quantity for an item
- **THEN** system records count and calculates variance from expected

#### Scenario: Mark item as counted
- **WHEN** user submits count for an item
- **THEN** system updates item status and shows variance indicator

### Requirement: Variance review page
The web application SHALL display count variances for review before adjustment.

#### Scenario: View variances
- **WHEN** count session is complete
- **THEN** system displays variance report with expected vs actual quantities

#### Scenario: Approve variances for adjustment
- **WHEN** reviewer approves variances
- **THEN** system creates stock adjustments to reconcile inventory

#### Scenario: Investigate variance
- **WHEN** reviewer flags variance for investigation
- **THEN** system records flag and allows recount
