## ADDED Requirements

### Requirement: Item detail page tabbed layout
The item edit page SHALL display a tabbed interface with Details, Images, and Variants tabs. The Details tab SHALL contain the existing item edit form. The Images tab SHALL allow uploading, viewing, deleting, and setting primary images. The Variants tab SHALL allow creating, viewing, editing, and deleting item variants.

#### Scenario: View item with images tab
- **WHEN** user navigates to item edit page and clicks the Images tab
- **THEN** system displays the image gallery with upload zone and existing images grid

#### Scenario: View item with variants tab
- **WHEN** user navigates to item edit page for a VARIANT_PARENT item and clicks the Variants tab
- **THEN** system displays the variant list table with edit and create capabilities

#### Scenario: Variant stock indicators in item list
- **WHEN** user views the items list page and an item has type VARIANT_PARENT
- **THEN** system displays a variant count badge and aggregated stock total across all variants
