## ADDED Requirements

### Requirement: Direct GRN creation without PO
The system SHALL allow users to create a goods received note directly without a linked purchase order.

#### Scenario: Create direct GRN
- **WHEN** user creates GRN with vendor, items, and quantities without PO reference
- **THEN** system creates GRN record and updates inventory quantities

#### Scenario: Direct GRN inventory update
- **WHEN** direct GRN is completed
- **THEN** system increases stock levels for received items in specified warehouse/bins

### Requirement: GRN creation form in web UI
The web application SHALL provide a form to create GRN from purchase order or directly.

#### Scenario: Create GRN from PO
- **WHEN** user selects PO and enters received quantities
- **THEN** system creates GRN linked to PO and updates PO received status

#### Scenario: Create direct GRN via form
- **WHEN** user fills GRN form without PO selection
- **THEN** system creates standalone GRN with entered details

### Requirement: Quantity entry with validation
The web form SHALL validate received quantities against PO quantities when applicable.

#### Scenario: Accept valid quantities
- **WHEN** user enters quantities within PO ordered amounts
- **THEN** system accepts the quantities

#### Scenario: Warn on over-receipt
- **WHEN** user enters quantity exceeding PO ordered amount
- **THEN** system displays warning but allows override

### Requirement: Bin assignment in receiving
The web form SHALL allow users to assign received items to specific bin locations.

#### Scenario: Assign items to bins
- **WHEN** user specifies bin location for received items
- **THEN** system records bin assignment and updates bin stock levels

#### Scenario: Default bin assignment
- **WHEN** user does not specify bin and warehouse has default bin
- **THEN** system assigns items to default receiving bin

### Requirement: GRN print view
The web application SHALL provide a print-friendly view of the GRN.

#### Scenario: Print GRN
- **WHEN** user clicks print on GRN detail page
- **THEN** system displays/downloads printable GRN document
