## ADDED Requirements

### Requirement: Variant selection in sales order line items
The sales order form SHALL detect when a selected item is a VARIANT_PARENT and require the user to select a specific variant before adding the line item. The variant selector SHALL load available variants from the API and use the variant's item ID for the order line.

#### Scenario: Select variant parent item
- **WHEN** user adds a VARIANT_PARENT item to a sales order
- **THEN** system displays a variant selector dropdown populated with available variants

#### Scenario: Variant replaces parent in line item
- **WHEN** user selects a specific variant from the dropdown
- **THEN** the line item uses the variant's item ID, SKU, and price instead of the parent's
