## ADDED Requirements

### Requirement: Purchase order creation
The system SHALL allow users to create purchase orders with vendor, line items, and delivery details.

#### Scenario: Create purchase order
- **WHEN** user creates PO with vendor and at least one line item
- **THEN** system generates PO number, calculates totals, and saves in draft status

#### Scenario: Auto-generate PO number
- **WHEN** purchase order is created
- **THEN** system assigns next number in sequence (e.g., PO-202601-00001)

### Requirement: Purchase order line items
The system SHALL support line items with item, quantity, unit price, discount, and tax.

#### Scenario: Add line item
- **WHEN** user adds item with quantity 100 and unit price RM 10
- **THEN** system calculates line total as RM 1000

#### Scenario: Apply vendor pricing
- **WHEN** user adds item linked to vendor with special pricing
- **THEN** system auto-fills vendor's price for that item

### Requirement: Purchase order pricing
The system SHALL auto-populate prices from vendor's price list or item's cost price.

#### Scenario: Vendor price lookup
- **WHEN** user adds item that vendor supplies
- **THEN** system fills price from vendor-item link

#### Scenario: Default to cost price
- **WHEN** no vendor-specific price exists
- **THEN** system fills item's cost price as default

### Requirement: Order-level discount
The system SHALL support order-level discounts as percentage or fixed amount.

#### Scenario: Apply percentage discount
- **WHEN** user applies 5% discount to RM 10,000 subtotal
- **THEN** system deducts RM 500 from total

### Requirement: Purchase order tax calculation
The system SHALL calculate tax based on item tax rates.

#### Scenario: Calculate PO tax
- **WHEN** PO has taxable items at 10%
- **THEN** system calculates and displays tax amount

### Requirement: Purchase order status lifecycle
The system SHALL manage PO through statuses: Draft, Issued, Partially Received, Received, Billed, Closed.

#### Scenario: Initial status
- **WHEN** PO is created
- **THEN** status is Draft

#### Scenario: Issue PO
- **WHEN** user issues PO
- **THEN** status changes to Issued, PO is sent/printable

#### Scenario: Partial receiving
- **WHEN** some items are received
- **THEN** status changes to Partially Received

#### Scenario: Full receiving
- **WHEN** all items are received
- **THEN** status changes to Received

### Requirement: Purchase order issuance
The system SHALL allow issuing draft POs, making them official and ready to send to vendor.

#### Scenario: Issue PO
- **WHEN** user issues draft PO
- **THEN** status changes to Issued, expected delivery date is set

### Requirement: Purchase order editing
The system SHALL allow editing draft POs. Issued POs have limited edits.

#### Scenario: Edit draft PO
- **WHEN** user modifies draft PO line items
- **THEN** system recalculates totals and saves

#### Scenario: Edit issued PO
- **WHEN** user attempts to change issued PO quantities
- **THEN** system allows changes with audit trail

### Requirement: Purchase order cancellation
The system SHALL allow cancelling POs in Draft or Issued status.

#### Scenario: Cancel draft PO
- **WHEN** user cancels draft PO
- **THEN** status changes to Cancelled

#### Scenario: Cancel issued PO
- **WHEN** user cancels issued PO not yet received
- **THEN** status changes to Cancelled

#### Scenario: Cancel partially received PO
- **WHEN** user attempts to cancel PO with received items
- **THEN** system returns error "Cannot cancel PO with received items"

### Requirement: Purchase order email sending
The system SHALL allow sending PO to vendor via email as PDF attachment.

#### Scenario: Email PO to vendor
- **WHEN** user sends issued PO
- **THEN** system emails PDF to vendor's email address

### Requirement: Purchase order PDF generation
The system SHALL generate printable PDF of purchase order with company branding.

#### Scenario: Generate PO PDF
- **WHEN** user requests PDF
- **THEN** system generates PDF with company logo, line items, and terms

### Requirement: Expected delivery date
The system SHALL track expected delivery date for each PO.

#### Scenario: Set expected date
- **WHEN** user sets expected delivery date
- **THEN** system stores date for tracking and alerts

#### Scenario: Calculate from lead time
- **WHEN** user doesn't specify date
- **THEN** system suggests date based on vendor's lead time

### Requirement: Vendor reference tracking
The system SHALL store vendor's quotation/reference number.

#### Scenario: Store vendor reference
- **WHEN** user enters vendor quote number "VQ-2026-123"
- **THEN** reference is stored and shown on documents

### Requirement: Purchase order notes
The system SHALL support notes for internal use and notes that appear on PO.

#### Scenario: Add internal note
- **WHEN** user adds internal note
- **THEN** note visible to staff but not on PO sent to vendor

#### Scenario: Add vendor note
- **WHEN** user adds note for vendor
- **THEN** note appears on PO PDF

### Requirement: Purchase order receiving summary
The system SHALL show receiving status per line item (ordered vs. received).

#### Scenario: View receiving status
- **WHEN** user views PO
- **THEN** each line shows ordered quantity and received quantity

### Requirement: Purchase order listing and filtering
The system SHALL provide list view with filters for status, vendor, and date range.

#### Scenario: List open POs
- **WHEN** user calls GET /purchase-orders?status=issued
- **THEN** system returns issued POs awaiting receiving

#### Scenario: Filter by vendor
- **WHEN** user calls GET /purchase-orders?vendor_id=123
- **THEN** system returns POs for that vendor

### Requirement: Reorder suggestions
The system SHALL suggest items to reorder based on stock levels and reorder points.

#### Scenario: Generate reorder suggestions
- **WHEN** user views reorder report
- **THEN** system lists items below reorder point with suggested quantities and vendors

#### Scenario: Create PO from suggestions
- **WHEN** user selects suggested items
- **THEN** system creates draft PO grouped by vendor

### Requirement: Purchase order closing
The system SHALL allow closing POs that are fully received and billed.

#### Scenario: Close PO
- **WHEN** PO is received and billed
- **THEN** user can close PO, status changes to Closed

#### Scenario: Force close
- **WHEN** user force closes partially received PO
- **THEN** system closes PO and cancels remaining quantities
