## ADDED Requirements

### Requirement: Item variant creation
The system SHALL allow users to create variants for items. Each variant SHALL have a unique SKU derived from the parent item SKU plus variant attributes. Variants SHALL support configurable attributes (size, color, material, etc.) stored as JSON.

#### Scenario: Create size variant
- **WHEN** user creates variant for item "T-Shirt" with attribute size=Large
- **THEN** system creates variant with SKU "TSHIRT-L" and stores attributes {size: "Large"}

#### Scenario: Create multi-attribute variant
- **WHEN** user creates variant with size=Medium and color=Blue
- **THEN** system creates variant with combined SKU "TSHIRT-M-BLUE" and attributes {size: "Medium", color: "Blue"}

#### Scenario: Variant SKU uniqueness
- **WHEN** user tries to create variant with duplicate attribute combination
- **THEN** system returns 400 error indicating variant already exists

### Requirement: Variant inventory tracking
Each variant SHALL have its own independent inventory levels. Stock counts, adjustments, and movements SHALL be tracked at the variant level.

#### Scenario: Variant stock levels
- **WHEN** viewing item with variants
- **THEN** each variant shows its own stock quantity separate from other variants

#### Scenario: Variant in stock count
- **WHEN** performing stock count on item with variants
- **THEN** system requires count entry for each variant separately

### Requirement: Variant pricing
Variants MAY have price overrides for cost price and selling price. If no override is set, the parent item's prices SHALL be used.

#### Scenario: Variant price override
- **WHEN** variant has sellingPrice set to $25
- **THEN** sales orders use $25 for that variant instead of parent item price

#### Scenario: Variant inherits parent price
- **WHEN** variant has no price override
- **THEN** system uses parent item's selling price

### Requirement: Variant listing and filtering
The API SHALL support listing variants for an item and filtering items by variant attributes.

#### Scenario: List item variants
- **WHEN** GET /api/items/:id/variants
- **THEN** system returns all variants for that item with their attributes and stock

#### Scenario: Filter by variant attribute
- **WHEN** GET /api/items?variantAttribute=color&variantValue=Blue
- **THEN** system returns items that have a Blue color variant

### Requirement: Variant management UI
The web application SHALL provide variant management interface on the item detail page. Users SHALL be able to add, edit, and delete variants.

#### Scenario: Add variant form
- **WHEN** user clicks "Add Variant" on item page
- **THEN** modal opens with attribute input fields and SKU preview

#### Scenario: Variant attribute configuration
- **WHEN** user adds new attribute type (e.g., "Material")
- **THEN** attribute becomes available for variant creation

#### Scenario: Bulk variant creation
- **WHEN** user selects multiple attribute values (3 sizes x 4 colors)
- **THEN** system offers to create all 12 variant combinations at once

#### Scenario: Delete variant
- **WHEN** user deletes variant with zero stock
- **THEN** variant is removed after confirmation

#### Scenario: Prevent delete variant with stock
- **WHEN** user tries to delete variant with stock > 0
- **THEN** system shows error requiring stock adjustment first

### Requirement: Variant in sales orders
Sales orders SHALL support selecting specific variants when adding items. The order line SHALL reference the variant ID and use variant-specific pricing.

#### Scenario: Select variant in order
- **WHEN** adding item with variants to sales order
- **THEN** user must select specific variant before adding to order

#### Scenario: Variant on order PDF
- **WHEN** printing order with variant items
- **THEN** PDF shows variant attributes (e.g., "T-Shirt - Large, Blue")
