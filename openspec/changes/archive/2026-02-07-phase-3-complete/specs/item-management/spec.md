## ADDED Requirements

### Requirement: Item image management
Items SHALL support multiple associated images. The system SHALL provide endpoints for uploading, listing, and deleting item images.

#### Scenario: Upload item image
- **WHEN** POST /api/items/:id/images with image file
- **THEN** image is stored and associated with item, URL returned

#### Scenario: List item images
- **WHEN** GET /api/items/:id/images
- **THEN** array of image records with URLs is returned

#### Scenario: Set primary image
- **WHEN** PATCH /api/items/:id/images/:imageId with {isPrimary: true}
- **THEN** image becomes primary and previous primary is unset

### Requirement: Item variants support
Items SHALL support variants with different SKUs and attributes. Parent items with variants SHALL aggregate variant stock for display.

#### Scenario: Item with variants indicator
- **WHEN** GET /api/items returns item with variants
- **THEN** item includes hasVariants: true and variantCount field

#### Scenario: Aggregate variant stock
- **WHEN** viewing item list with variant items
- **THEN** total stock shown is sum of all variant stocks

### Requirement: Item CSV bulk import
Items SHALL be importable via CSV upload with validation and atomic transaction handling.

#### Scenario: Import items endpoint
- **WHEN** POST /api/items/import with CSV file
- **THEN** items are validated, created in transaction, results returned

#### Scenario: Download import template
- **WHEN** GET /api/items/import/template
- **THEN** CSV template file with headers is downloaded
