## ADDED Requirements

### Requirement: Sales order creation
The system SHALL allow users to create sales orders with customer, line items, and shipping details.

#### Scenario: Create sales order
- **WHEN** user creates sales order with customer and at least one line item
- **THEN** system generates SO number, calculates totals, and returns order in draft status

#### Scenario: Auto-generate SO number
- **WHEN** sales order is created
- **THEN** system assigns next number in sequence (e.g., SO-202601-00001)

#### Scenario: Stock availability check
- **WHEN** user adds item to sales order
- **THEN** system displays available stock and warns if quantity exceeds availability

### Requirement: Sales order line items
The system SHALL support line items with item, quantity, unit price, discount, and tax.

#### Scenario: Add line item
- **WHEN** user adds item with quantity 10 and unit price RM 50
- **THEN** system calculates line total as RM 500

#### Scenario: Apply line discount
- **WHEN** user applies 10% discount to line
- **THEN** system calculates line total with discount applied

#### Scenario: Apply line tax
- **WHEN** line item has tax rate of 10%
- **THEN** system calculates tax amount and adds to line total

### Requirement: Sales order pricing
The system SHALL auto-populate prices from item's selling price. Users MAY override prices within allowed limits.

#### Scenario: Auto-populate price
- **WHEN** user adds item to order
- **THEN** system fills unit price from item's selling price

#### Scenario: Price override
- **WHEN** user changes unit price
- **THEN** system accepts if above minimum selling price

#### Scenario: Below minimum price
- **WHEN** user sets price below item's minimum selling price
- **THEN** system warns and requires manager approval

### Requirement: Order-level discount
The system SHALL support order-level discounts as percentage or fixed amount.

#### Scenario: Apply percentage discount
- **WHEN** user applies 5% order discount to RM 1000 subtotal
- **THEN** system deducts RM 50 from order total

#### Scenario: Apply fixed discount
- **WHEN** user applies RM 100 fixed discount
- **THEN** system deducts RM 100 from order total

### Requirement: Sales order tax calculation
The system SHALL calculate tax based on item tax rates and organization's tax settings.

#### Scenario: Calculate order tax
- **WHEN** order has taxable items
- **THEN** system calculates total tax and displays in order summary

#### Scenario: Tax-exempt customer
- **WHEN** customer is marked as tax-exempt
- **THEN** system excludes tax from order calculations

### Requirement: Sales order status lifecycle
The system SHALL manage sales order through statuses: Draft, Confirmed, Picking, Packed, Shipped, Invoiced, Closed.

#### Scenario: Create as draft
- **WHEN** sales order is created
- **THEN** initial status is Draft

#### Scenario: Confirm order
- **WHEN** user confirms draft order
- **THEN** status changes to Confirmed and stock is committed

#### Scenario: Status progression
- **WHEN** order moves through fulfillment stages
- **THEN** status updates to Picking, Packed, Shipped accordingly

### Requirement: Sales order confirmation
The system SHALL allow confirming draft orders, which commits stock and makes the order ready for fulfillment.

#### Scenario: Confirm with available stock
- **WHEN** user confirms order and all items have sufficient stock
- **THEN** order status changes to Confirmed, stock is committed

#### Scenario: Confirm with insufficient stock
- **WHEN** user confirms order but some items lack stock
- **THEN** system warns user; user can proceed with partial or wait

### Requirement: Sales order editing
The system SHALL allow editing draft orders. Confirmed orders can only have limited edits (shipping address, notes).

#### Scenario: Edit draft order
- **WHEN** user modifies draft order line items
- **THEN** system recalculates totals and saves changes

#### Scenario: Edit confirmed order
- **WHEN** user attempts to add line to confirmed order
- **THEN** system returns HTTP 400 with error message "Cannot modify lines of confirmed order"

### Requirement: Sales order cancellation
The system SHALL allow cancelling orders in Draft or Confirmed status. Cancellation releases committed stock.

#### Scenario: Cancel draft order
- **WHEN** user cancels draft order
- **THEN** order status changes to Cancelled

#### Scenario: Cancel confirmed order
- **WHEN** user cancels confirmed order
- **THEN** status changes to Cancelled and committed stock is released

#### Scenario: Cancel shipped order
- **WHEN** user attempts to cancel shipped order
- **THEN** system returns HTTP 400; user must create sales return instead

### Requirement: Pick list generation
The system SHALL generate pick lists from confirmed orders, sorted by bin location for efficient picking.

#### Scenario: Generate pick list
- **WHEN** user generates pick list for confirmed order
- **THEN** system creates pick list with items sorted by bin location

#### Scenario: Batch pick list
- **WHEN** user generates pick list for multiple orders
- **THEN** system creates combined pick list grouped by item

### Requirement: Pick list processing
The system SHALL track pick list completion with picked quantities per line.

#### Scenario: Record picked quantity
- **WHEN** warehouse staff records 10 units picked of 12 ordered
- **THEN** system updates pick list line with picked quantity

#### Scenario: Complete pick list
- **WHEN** all lines are picked
- **THEN** pick list status changes to Complete, order status to Picking complete

#### Scenario: Short pick
- **WHEN** picked quantity is less than ordered
- **THEN** system flags for backorder or partial shipment

### Requirement: Sales order shipping
The system SHALL track shipment details including carrier, tracking number, and ship date.

#### Scenario: Create shipment
- **WHEN** user creates shipment for order
- **THEN** system records shipment details and updates order status to Shipped

#### Scenario: Partial shipment
- **WHEN** user ships partial order
- **THEN** system records partial shipment; remaining becomes backorder

### Requirement: Delivery order/note generation
The system SHALL generate delivery orders/notes (DO) for shipments.

#### Scenario: Generate delivery order
- **WHEN** shipment is created
- **THEN** system generates printable delivery order with item details

### Requirement: Sales order customer reference
The system SHALL store customer's PO/reference number for their tracking.

#### Scenario: Store customer reference
- **WHEN** user enters customer PO number "CUST-PO-12345"
- **THEN** system stores reference and displays on documents

### Requirement: Sales order notes and attachments
The system SHALL support internal notes and file attachments on sales orders.

#### Scenario: Add note
- **WHEN** user adds internal note to order
- **THEN** note is saved and visible to staff but not on customer documents

#### Scenario: Add attachment
- **WHEN** user attaches file to order
- **THEN** file is stored and linked to order

### Requirement: Sales order listing and filtering
The system SHALL provide list view with filters for status, date range, customer, and search.

#### Scenario: List all orders
- **WHEN** user calls GET /sales-orders
- **THEN** system returns paginated list of orders

#### Scenario: Filter by status
- **WHEN** user calls GET /sales-orders?status=confirmed
- **THEN** system returns only confirmed orders

#### Scenario: Filter by date range
- **WHEN** user calls GET /sales-orders?from=2026-01-01&to=2026-01-31
- **THEN** system returns orders within date range

### Requirement: Sales order PDF generation
The system SHALL generate printable PDF of sales order with company branding.

#### Scenario: Generate PDF
- **WHEN** user requests PDF of sales order
- **THEN** system generates PDF with order details, company logo, and terms
