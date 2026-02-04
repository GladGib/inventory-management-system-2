## ADDED Requirements

### Requirement: Item variants management
The system SHALL support item variants for products with multiple options such as size, color, or style.

#### Scenario: Create item with variants
- **WHEN** user creates an item and enables variants
- **THEN** system allows defining variant attributes (e.g., Size, Color)
- **AND** generates variants for each combination of attribute values

#### Scenario: Variant SKU generation
- **WHEN** variants are created
- **THEN** system generates unique SKU for each variant based on parent SKU and attributes
- **AND** SKU format is {parent-sku}-{attribute-values} (e.g., SHIRT-001-M-RED)

#### Scenario: Variant inventory tracking
- **WHEN** variants exist for an item
- **THEN** stock levels are tracked per variant, not at parent item level
- **AND** parent item displays aggregated stock from all variants

#### Scenario: Variant pricing
- **WHEN** variant is created
- **THEN** variant inherits base price from parent item
- **AND** user can override price per variant if needed

#### Scenario: Add variant to existing item
- **WHEN** user adds variant attributes to item without variants
- **THEN** system creates variants while preserving existing stock as default variant

#### Scenario: Variant barcode
- **WHEN** variant is created
- **THEN** variant can have its own unique barcode
- **AND** barcode lookup returns the specific variant

### Requirement: Item image management
The system SHALL allow users to upload and manage images for items.

#### Scenario: Upload item image
- **WHEN** user uploads an image for an item
- **THEN** system stores the image and associates it with the item
- **AND** first uploaded image becomes the primary image

#### Scenario: Set primary image
- **WHEN** user sets an image as primary
- **THEN** that image is displayed in list views and search results
- **AND** previous primary image becomes secondary

#### Scenario: Delete item image
- **WHEN** user deletes an item image
- **THEN** image is removed from item
- **AND** if deleted image was primary, next image becomes primary

### Requirement: Item variants UI
The web application SHALL provide UI for managing item variants.

#### Scenario: Variant configuration in item form
- **WHEN** user edits an item with variants enabled
- **THEN** form shows variant attributes section
- **AND** allows adding/removing attributes and values

#### Scenario: Variant list view
- **WHEN** viewing item with variants
- **THEN** system displays table of all variants
- **AND** shows SKU, attributes, stock, and price for each

#### Scenario: Bulk variant operations
- **WHEN** user selects multiple variants
- **THEN** system allows bulk price update or status change
