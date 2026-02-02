## ADDED Requirements

### Requirement: Simple item creation
The system SHALL allow users to create simple items with code, name, description, brand, category, UOM, cost price, selling price, and tax rate.

#### Scenario: Create simple item
- **WHEN** user creates item with required fields (code, name, UOM, selling price)
- **THEN** system saves item and returns created record with ID

#### Scenario: Auto-generate item code
- **WHEN** user creates item without specifying code
- **THEN** system generates unique code using configured pattern

#### Scenario: Duplicate code prevention
- **WHEN** user creates item with code that already exists
- **THEN** system returns HTTP 400 with error message "Item code already exists"

### Requirement: Item variant management
The system SHALL allow users to create variant items with a parent item and variants based on attributes (size, color, grade, etc.).

#### Scenario: Create variant parent
- **WHEN** user creates item with type "variant_parent" and defines attributes
- **THEN** system creates parent item without stock tracking

#### Scenario: Add variant to parent
- **WHEN** user adds variant with attribute values to parent item
- **THEN** system creates variant item with unique SKU, inheriting parent's base properties

#### Scenario: List item variants
- **WHEN** user calls GET /items/:parentId/variants
- **THEN** system returns all variants of the parent item

### Requirement: Item listing and search
The system SHALL allow users to list, filter, and search items with pagination.

#### Scenario: List all items
- **WHEN** user calls GET /items
- **THEN** system returns paginated list of items (default 20 per page)

#### Scenario: Search items by name or code
- **WHEN** user calls GET /items?search=brake
- **THEN** system returns items where name or code contains "brake"

#### Scenario: Filter items by category
- **WHEN** user calls GET /items?category_id=123
- **THEN** system returns items in specified category and its subcategories

#### Scenario: Filter items by active status
- **WHEN** user calls GET /items?active=true
- **THEN** system returns only active items

### Requirement: Item update
The system SHALL allow users to update item details. SKU/code changes SHALL be restricted after item has transactions.

#### Scenario: Update item details
- **WHEN** user updates item name, description, or prices
- **THEN** system saves changes and returns updated item

#### Scenario: Code change restriction
- **WHEN** user attempts to change code of item with existing transactions
- **THEN** system returns HTTP 400 with error message "Cannot change code for item with transactions"

### Requirement: Item soft delete
The system SHALL soft delete items (set deleted_at timestamp). Deleted items SHALL be excluded from lists but retained for transaction history.

#### Scenario: Delete item without transactions
- **WHEN** user deletes item that has no transactions
- **THEN** system sets deleted_at timestamp and excludes item from normal queries

#### Scenario: Delete item with transactions
- **WHEN** user deletes item that has transactions
- **THEN** system sets deleted_at but item remains accessible via transaction history

### Requirement: Hierarchical category management
The system SHALL support up to 3 levels of category hierarchy for organizing items.

#### Scenario: Create root category
- **WHEN** user creates category without parent_id
- **THEN** system creates root-level category

#### Scenario: Create subcategory
- **WHEN** user creates category with parent_id
- **THEN** system creates child category linked to parent

#### Scenario: List category tree
- **WHEN** user calls GET /categories?tree=true
- **THEN** system returns hierarchical category structure

#### Scenario: Category depth limit
- **WHEN** user attempts to create category at level 4 (great-grandchild)
- **THEN** system returns HTTP 400 with error message "Maximum category depth is 3 levels"

### Requirement: Item barcode support
The system SHALL support barcode assignment to items (EAN-13, Code 128, QR Code formats).

#### Scenario: Assign barcode
- **WHEN** user assigns barcode "4806512345678" to item
- **THEN** system saves barcode linked to item

#### Scenario: Barcode lookup
- **WHEN** user calls GET /items/barcode/4806512345678
- **THEN** system returns item associated with that barcode

#### Scenario: Duplicate barcode prevention
- **WHEN** user assigns barcode already in use by another item
- **THEN** system returns HTTP 400 with error message "Barcode already assigned to another item"

### Requirement: Item image management
The system SHALL allow up to 5 images per item with one designated as primary.

#### Scenario: Upload item image
- **WHEN** user uploads image for item
- **THEN** system stores image and links to item

#### Scenario: Set primary image
- **WHEN** user designates an image as primary
- **THEN** that image is used as thumbnail in lists

#### Scenario: Image limit enforcement
- **WHEN** user attempts to upload 6th image for an item
- **THEN** system returns HTTP 400 with error message "Maximum 5 images per item"

### Requirement: Inventory tracking settings
The system SHALL allow configuration of whether an item tracks inventory. Non-tracked items (services) do not affect stock levels.

#### Scenario: Enable inventory tracking
- **WHEN** user creates item with track_inventory=true
- **THEN** system tracks stock levels for this item

#### Scenario: Disable inventory tracking
- **WHEN** user creates item with track_inventory=false
- **THEN** system does not track stock; item can be sold without stock check

### Requirement: Reorder settings
The system SHALL allow setting reorder point and reorder quantity for items to generate low stock alerts.

#### Scenario: Set reorder point
- **WHEN** user sets reorder_point=10 and reorder_qty=50 for item
- **THEN** system triggers alert when stock falls to 10 or below

### Requirement: Item pricing
The system SHALL store cost price, selling price, wholesale price, and minimum selling price for each item.

#### Scenario: Price validation
- **WHEN** user sets selling price below minimum selling price
- **THEN** system returns HTTP 400 with error message "Selling price cannot be below minimum price"

### Requirement: Unit of measure
The system SHALL require a unit of measure (UOM) for each item (e.g., pcs, box, kg, liter).

#### Scenario: UOM assignment
- **WHEN** user creates item with UOM "pcs"
- **THEN** all quantities for this item are tracked in pieces

### Requirement: Item stock view
The system SHALL provide stock summary per item showing on-hand, committed, and available quantities across all warehouses.

#### Scenario: View item stock
- **WHEN** user calls GET /items/:id/stock
- **THEN** system returns stock levels per warehouse with totals

### Requirement: Bulk item import
The system SHALL allow importing items from CSV file with validation and error reporting.

#### Scenario: Successful import
- **WHEN** user uploads valid CSV with 100 items
- **THEN** system creates all items and returns success count

#### Scenario: Import with errors
- **WHEN** user uploads CSV with some invalid rows
- **THEN** system imports valid rows and returns error report for invalid rows
