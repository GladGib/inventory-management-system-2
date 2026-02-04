## ADDED Requirements

### Requirement: Create return from invoice
The web application SHALL allow users to initiate a sales return directly from an invoice.

#### Scenario: Start return from invoice
- **WHEN** user clicks "Create Return" on invoice detail page
- **THEN** system opens return form pre-populated with invoice items

#### Scenario: Select items for return
- **WHEN** user selects items and quantities to return
- **THEN** system validates quantities against invoiced amounts

### Requirement: Return inspection workflow UI
The web application SHALL provide an inspection workflow for received returns.

#### Scenario: Record inspection results
- **WHEN** user inspects returned items
- **THEN** system allows recording condition (resellable, damaged, defective)

#### Scenario: Complete inspection
- **WHEN** user completes inspection for all items
- **THEN** system updates return status and enables credit note generation

### Requirement: Return restocking
The system SHALL update inventory when inspected items are marked resellable.

#### Scenario: Restock resellable items
- **WHEN** items are marked resellable during inspection
- **THEN** system increases inventory for those items

#### Scenario: Handle non-resellable items
- **WHEN** items are marked damaged or defective
- **THEN** system records disposition without restocking

### Requirement: Credit note integration
The sales returns workflow SHALL integrate with credit note generation.

#### Scenario: Generate credit note after inspection
- **WHEN** return inspection is complete and approved
- **THEN** system enables credit note generation with calculated amounts
