## ADDED Requirements

### Requirement: Warehouse CRUD operations
The system SHALL allow administrators to create, read, update, and deactivate warehouses.

#### Scenario: Create warehouse
- **WHEN** administrator creates warehouse with code, name, and address
- **THEN** system saves warehouse and returns record with ID

#### Scenario: List warehouses
- **WHEN** user calls GET /warehouses
- **THEN** system returns list of active warehouses

#### Scenario: Get warehouse by ID
- **WHEN** user calls GET /warehouses/:id
- **THEN** system returns warehouse details including stock summary

#### Scenario: Update warehouse
- **WHEN** administrator updates warehouse name or address
- **THEN** system saves changes

#### Scenario: Deactivate warehouse
- **WHEN** administrator deactivates warehouse with no stock
- **THEN** system sets warehouse to inactive

#### Scenario: Deactivate warehouse with stock
- **WHEN** administrator attempts to deactivate warehouse with stock > 0
- **THEN** system returns HTTP 400 with error message "Cannot deactivate warehouse with existing stock"

### Requirement: Primary warehouse designation
The system SHALL allow designating one warehouse as primary. The primary warehouse is used as default for new transactions.

#### Scenario: Set primary warehouse
- **WHEN** administrator sets warehouse as primary
- **THEN** that warehouse becomes default for new sales orders and receiving

#### Scenario: Single primary
- **WHEN** administrator sets new primary warehouse
- **THEN** previous primary warehouse loses primary status

### Requirement: Warehouse address
The system SHALL store full address for each warehouse including contact person and phone.

#### Scenario: Store warehouse address
- **WHEN** administrator enters warehouse address
- **THEN** system saves address for use in shipping and receiving documents

### Requirement: Bin location management
The system SHALL support bin locations within warehouses using hierarchical codes (Zone-Aisle-Rack-Bin).

#### Scenario: Create bin location
- **WHEN** user creates bin location "A-01-02-03" in warehouse
- **THEN** system saves location linked to warehouse

#### Scenario: List bin locations
- **WHEN** user calls GET /warehouses/:id/bins
- **THEN** system returns all bin locations in that warehouse

#### Scenario: Validate bin code format
- **WHEN** user creates bin with invalid format
- **THEN** system returns HTTP 400 with error message "Invalid bin code format"

### Requirement: Default bin per item
The system SHALL allow setting a default bin location for each item in a warehouse.

#### Scenario: Set default bin
- **WHEN** user sets default bin "A-01-02-03" for item in warehouse
- **THEN** system uses this bin as default for receiving and picking

#### Scenario: Get default bin
- **WHEN** user receives item without specifying bin
- **THEN** system suggests default bin for that item

### Requirement: Stock levels per warehouse
The system SHALL track stock quantities per item per warehouse.

#### Scenario: View warehouse stock
- **WHEN** user calls GET /warehouses/:id/stock
- **THEN** system returns all items and quantities in that warehouse

#### Scenario: Stock by bin
- **WHEN** user calls GET /warehouses/:id/stock?by_bin=true
- **THEN** system returns stock breakdown by bin location

### Requirement: Stock levels per bin
The system SHALL track stock quantities per item per bin location.

#### Scenario: View bin stock
- **WHEN** user views bin location details
- **THEN** system shows items and quantities stored in that bin

### Requirement: Available vs committed stock
The system SHALL calculate available stock as on-hand minus committed (reserved for pending orders).

#### Scenario: Calculate available stock
- **WHEN** warehouse has 100 units on-hand and 30 committed
- **THEN** available stock shows as 70

#### Scenario: Commit stock on order
- **WHEN** sales order is confirmed
- **THEN** ordered quantities are added to committed stock

#### Scenario: Release committed stock
- **WHEN** sales order is shipped or cancelled
- **THEN** committed stock is reduced accordingly

### Requirement: Stock on order tracking
The system SHALL track incoming stock from open purchase orders.

#### Scenario: View stock on order
- **WHEN** user views item stock
- **THEN** system shows quantity on open POs as "on order"

### Requirement: Warehouse stock summary
The system SHALL provide summary view showing total items, total value, and movements for a warehouse.

#### Scenario: View warehouse summary
- **WHEN** user calls GET /warehouses/:id/summary
- **THEN** system returns total SKUs, total units, total value, and recent movement counts

### Requirement: Low stock alerts
The system SHALL generate alerts when item stock falls at or below reorder point in any warehouse.

#### Scenario: Trigger low stock alert
- **WHEN** item stock reaches reorder point
- **THEN** system creates alert visible on dashboard and in reports

### Requirement: Stock movement history
The system SHALL maintain history of all stock movements per warehouse with timestamps and references.

#### Scenario: View movement history
- **WHEN** user calls GET /warehouses/:id/movements
- **THEN** system returns chronological list of stock in/out movements
