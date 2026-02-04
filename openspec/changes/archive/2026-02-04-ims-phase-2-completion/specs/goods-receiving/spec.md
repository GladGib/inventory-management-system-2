## ADDED Requirements

### Requirement: Direct GRN creation
The system SHALL allow creating goods received notes without a purchase order.

#### Scenario: Create direct GRN
- **WHEN** user creates GRN without selecting a PO
- **THEN** system allows entering vendor, items, and quantities manually
- **AND** GRN is created without PO reference

#### Scenario: Direct GRN item entry
- **WHEN** creating direct GRN
- **THEN** user can search and add items from catalog
- **AND** enter received quantities and unit costs

#### Scenario: Direct GRN warehouse selection
- **WHEN** creating direct GRN
- **THEN** user must select destination warehouse
- **AND** can specify bin locations per item

### Requirement: GRN creation form with quantity entry
The web application SHALL provide a form for creating GRNs from purchase orders.

#### Scenario: GRN creation from PO
- **WHEN** user clicks "Receive" on a purchase order
- **THEN** system shows form with PO items and ordered quantities
- **AND** user enters received quantities per item

#### Scenario: Quantity validation
- **WHEN** user enters received quantity
- **THEN** system validates against remaining unreceivedquantity
- **AND** warns if receiving more than ordered

#### Scenario: Over-receiving handling
- **WHEN** received quantity exceeds ordered
- **THEN** system allows with confirmation
- **AND** records over-receipt for review

### Requirement: Bin assignment in receiving
The system SHALL support assigning items to bin locations during receiving.

#### Scenario: Bin selection per item
- **WHEN** receiving items into warehouse with bins
- **THEN** user can select bin location for each item
- **AND** default bin is suggested if configured

#### Scenario: Multiple bins per item
- **WHEN** receiving large quantity
- **THEN** user can split quantity across multiple bins
- **AND** total across bins must equal received quantity

#### Scenario: Bin validation
- **WHEN** bin is selected
- **THEN** system validates bin exists in destination warehouse
- **AND** shows error for invalid bin codes

### Requirement: GRN print view
The web application SHALL provide print functionality for goods received notes.

#### Scenario: Print GRN
- **WHEN** user clicks print on GRN detail
- **THEN** system opens print dialog with GRN document
- **AND** document includes all received items and quantities

#### Scenario: GRN print format
- **WHEN** GRN is printed
- **THEN** document includes GRN number, date, vendor, warehouse
- **AND** shows item details with bin assignments
- **AND** includes signature area for receiver

### Requirement: Receiving form UI
The web application SHALL provide a complete receiving form.

#### Scenario: Receiving form layout
- **WHEN** user opens receiving form
- **THEN** form shows PO header info and items table
- **AND** each item row has quantity input and bin selector

#### Scenario: Batch lot entry
- **WHEN** item requires batch/lot tracking
- **THEN** form shows batch number input
- **AND** expiry date field if applicable

#### Scenario: Notes and attachments
- **WHEN** receiving goods
- **THEN** user can add receiving notes
- **AND** record any discrepancies or damage

#### Scenario: Form submission
- **WHEN** user submits receiving form
- **THEN** system validates all required fields
- **AND** creates GRN and updates inventory
- **AND** redirects to GRN detail page
