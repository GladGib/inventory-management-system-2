## ADDED Requirements

### Requirement: Warehouse switcher in app header
The mobile app main screen SHALL display the selected warehouse name in the app bar with a change button. Tapping the button SHALL navigate to the warehouse selection screen in change mode.

#### Scenario: Display current warehouse in header
- **WHEN** user is on the main screen with a warehouse selected
- **THEN** the app bar displays the warehouse name and a change icon

#### Scenario: Change warehouse from header
- **WHEN** user taps the warehouse change button in the app bar
- **THEN** system navigates to the warehouse selection screen allowing the user to pick a different warehouse

### Requirement: Warehouse-scoped API queries
All warehouse-dependent mobile screens SHALL pass the selected warehouse ID as a query parameter to API calls. This includes pick lists, goods receiving, stock counts, and stock lookups.

#### Scenario: Filter pick lists by warehouse
- **WHEN** user views pick lists with warehouse A selected
- **THEN** only pick lists for warehouse A are displayed

#### Scenario: Filter stock lookups by warehouse
- **WHEN** user views item stock details with warehouse A selected
- **THEN** only stock levels for warehouse A bins are displayed
