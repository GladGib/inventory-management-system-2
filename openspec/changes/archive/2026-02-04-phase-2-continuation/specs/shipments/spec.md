## ADDED Requirements

### Requirement: Create shipment from sales order
The system SHALL allow users to create a shipment for a confirmed sales order, specifying items and quantities to ship.

#### Scenario: Create partial shipment
- **WHEN** user creates a shipment with quantities less than the order total
- **THEN** system creates shipment record with status "pending" and updates order shipped quantities

#### Scenario: Create full shipment
- **WHEN** user creates a shipment with all remaining quantities
- **THEN** system creates shipment record and marks order as "shipped"

#### Scenario: Reject over-shipment
- **WHEN** user attempts to ship more than ordered quantity
- **THEN** system rejects with validation error

### Requirement: Shipment status management
The system SHALL track shipment status through its lifecycle: pending, dispatched, delivered.

#### Scenario: Dispatch shipment
- **WHEN** user marks shipment as dispatched
- **THEN** system updates status to "dispatched" and records dispatch date

#### Scenario: Confirm delivery
- **WHEN** user confirms shipment delivery
- **THEN** system updates status to "delivered" and records delivery date

### Requirement: Delivery order PDF generation
The system SHALL generate a printable delivery order PDF for each shipment.

#### Scenario: Generate delivery order PDF
- **WHEN** user requests delivery order PDF for a shipment
- **THEN** system returns PDF with shipment details, items, quantities, and delivery address

### Requirement: Shipment creation modal in web UI
The web application SHALL provide a modal dialog to create shipments from the sales order detail page.

#### Scenario: Open shipment modal
- **WHEN** user clicks "Create Shipment" on sales order page
- **THEN** system displays modal with items and remaining quantities to ship

#### Scenario: Submit shipment from modal
- **WHEN** user enters quantities and submits modal
- **THEN** system creates shipment and refreshes order detail page
