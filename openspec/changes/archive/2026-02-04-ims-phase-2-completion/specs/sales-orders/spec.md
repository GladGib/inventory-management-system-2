## ADDED Requirements

### Requirement: Shipment creation
The system SHALL support creating shipments for sales orders with carrier and tracking information.

#### Scenario: Create shipment from order
- **WHEN** user creates a shipment for a confirmed sales order
- **THEN** system records carrier name, tracking number, and ship date
- **AND** updates order status to SHIPPED

#### Scenario: Partial shipment
- **WHEN** user creates shipment for some items on an order
- **THEN** system creates shipment with specified quantities
- **AND** order status becomes PARTIALLY_SHIPPED
- **AND** remaining quantities can be shipped later

#### Scenario: Multiple shipments per order
- **WHEN** order has multiple shipments
- **THEN** system tracks each shipment separately
- **AND** displays shipment history on order detail

### Requirement: Delivery order PDF generation
The system SHALL generate delivery order documents for shipments.

#### Scenario: Generate delivery order
- **WHEN** shipment is created
- **THEN** system can generate delivery order PDF
- **AND** PDF includes shipped items, quantities, and delivery address

#### Scenario: Delivery order content
- **WHEN** delivery order PDF is generated
- **THEN** document includes shipment number, carrier, tracking number
- **AND** includes customer signature area
- **AND** lists items with shipped quantities

### Requirement: Order PDF preview and print
The web application SHALL provide order PDF preview and print functionality.

#### Scenario: Preview order PDF
- **WHEN** user clicks preview on sales order
- **THEN** system displays order PDF in modal or new tab
- **AND** shows all order details, items, and totals

#### Scenario: Print order
- **WHEN** user clicks print
- **THEN** system opens browser print dialog with order PDF
- **AND** PDF is formatted for standard paper sizes

### Requirement: Shipment creation UI
The web application SHALL provide a modal for creating shipments.

#### Scenario: Shipment creation modal
- **WHEN** user clicks "Create Shipment" on order
- **THEN** modal shows items available for shipping with quantities
- **AND** provides fields for carrier, tracking number, notes

#### Scenario: Quantity validation
- **WHEN** user enters ship quantity exceeding available
- **THEN** system shows error and prevents submission

#### Scenario: Shipment confirmation
- **WHEN** shipment is created successfully
- **THEN** modal closes and order detail refreshes
- **AND** success message is displayed
