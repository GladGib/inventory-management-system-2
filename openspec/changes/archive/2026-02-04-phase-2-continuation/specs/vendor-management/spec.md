## ADDED Requirements

### Requirement: Vendor details page with transactions
The web application SHALL provide a vendor details page showing all transactions.

#### Scenario: View vendor details
- **WHEN** user navigates to vendor detail page
- **THEN** system displays vendor information, contact details, and statistics

#### Scenario: View vendor transactions
- **WHEN** user views vendor details
- **THEN** system displays list of POs, GRNs, bills, and payments for that vendor

#### Scenario: View vendor balance
- **WHEN** user views vendor details
- **THEN** system displays outstanding balance (total bills minus payments)

### Requirement: Vendor-item linking UI
The web application SHALL allow users to link items to vendors with pricing.

#### Scenario: Add vendor item link
- **WHEN** user adds item to vendor
- **THEN** system creates vendor-item record with vendor SKU and price

#### Scenario: Update vendor item pricing
- **WHEN** user updates price for vendor item
- **THEN** system saves new price and maintains price history

#### Scenario: View vendor items
- **WHEN** user views vendor details
- **THEN** system displays list of items supplied by vendor with prices

#### Scenario: Remove vendor item link
- **WHEN** user removes item from vendor
- **THEN** system deactivates vendor-item link (preserves history)
