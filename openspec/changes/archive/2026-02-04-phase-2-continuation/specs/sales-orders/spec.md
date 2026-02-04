## ADDED Requirements

### Requirement: Sales order PDF preview and print
The web application SHALL provide PDF preview and print functionality for sales orders.

#### Scenario: Preview order PDF
- **WHEN** user clicks preview on sales order page
- **THEN** system displays order PDF in preview modal

#### Scenario: Download order PDF
- **WHEN** user clicks download/print on sales order page
- **THEN** system downloads sales order PDF

### Requirement: Shipment creation modal integration
The sales order detail page SHALL include shipment creation functionality.

#### Scenario: Show shipment button for confirmed orders
- **WHEN** user views confirmed order with unshipped items
- **THEN** system displays "Create Shipment" button

#### Scenario: Hide shipment button for draft orders
- **WHEN** user views draft or cancelled order
- **THEN** system does not display shipment button

#### Scenario: Show shipment history
- **WHEN** order has existing shipments
- **THEN** system displays shipment list with status and tracking
