## ADDED Requirements

### Requirement: Bin locations management UI
The web application SHALL provide UI to manage bin locations within warehouses.

#### Scenario: View bin locations
- **WHEN** user navigates to warehouse bin management
- **THEN** system displays list of bins with zone, aisle, rack, and shelf information

#### Scenario: Create bin location
- **WHEN** user creates new bin
- **THEN** system saves bin with location code and attributes

#### Scenario: Edit bin location
- **WHEN** user updates bin details
- **THEN** system saves changes (location code change may be restricted)

#### Scenario: Deactivate bin location
- **WHEN** user deactivates bin with zero stock
- **THEN** system marks bin as inactive

#### Scenario: Prevent deactivation with stock
- **WHEN** user attempts to deactivate bin with stock
- **THEN** system rejects with error indicating stock must be moved first

### Requirement: Stock by bin view
The web application SHALL display stock levels organized by bin location.

#### Scenario: View stock by bin
- **WHEN** user navigates to stock by bin view
- **THEN** system displays bins with items and quantities in each

#### Scenario: Filter by warehouse
- **WHEN** user selects warehouse filter
- **THEN** system displays only bins in selected warehouse

#### Scenario: Filter by item
- **WHEN** user searches for specific item
- **THEN** system displays bins containing that item with quantities

#### Scenario: View bin contents
- **WHEN** user clicks on specific bin
- **THEN** system displays all items in that bin with quantities and last movement date
