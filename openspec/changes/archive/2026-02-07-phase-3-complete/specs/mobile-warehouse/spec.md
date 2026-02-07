## ADDED Requirements

### Requirement: Warehouse selection screen
The mobile app SHALL provide a warehouse selection screen for users with access to multiple warehouses. The selected warehouse SHALL persist across sessions.

#### Scenario: Display warehouse list
- **WHEN** user opens warehouse selection screen
- **THEN** list of warehouses user has access to is displayed

#### Scenario: Select warehouse
- **WHEN** user taps on warehouse
- **THEN** warehouse is selected and user proceeds to main app

#### Scenario: Persist selection
- **WHEN** user relaunches app
- **THEN** previously selected warehouse is remembered

#### Scenario: Change warehouse
- **WHEN** user taps warehouse name in header
- **THEN** warehouse selection screen opens to allow changing

### Requirement: Item details screen with stock
The mobile app SHALL provide an item details screen showing item information and real-time stock levels by bin location.

#### Scenario: View item details
- **WHEN** user scans item barcode or selects from list
- **THEN** item details screen shows name, SKU, description, images

#### Scenario: Stock by bin display
- **WHEN** viewing item details
- **THEN** stock levels shown broken down by bin location in current warehouse

#### Scenario: Variant stock display
- **WHEN** viewing item with variants
- **THEN** stock levels shown for each variant separately

### Requirement: Bin stock view screen
The mobile app SHALL provide a bin stock view screen showing all items in a specific bin location.

#### Scenario: View bin contents
- **WHEN** user scans bin barcode or selects from list
- **THEN** screen shows all items and quantities in that bin

#### Scenario: Empty bin display
- **WHEN** bin has no items
- **THEN** screen indicates bin is empty

#### Scenario: Navigate to item
- **WHEN** user taps item in bin view
- **THEN** navigation to item details screen occurs

### Requirement: Offline conflict detection
The mobile app SHALL detect conflicts between offline operations and server state. Conflicts SHALL be flagged for user review.

#### Scenario: Detect stock conflict
- **WHEN** syncing offline stock count and server stock changed since
- **THEN** conflict is detected and flagged for review

#### Scenario: Display conflict list
- **WHEN** conflicts exist after sync
- **THEN** conflict banner shows with count and link to review

#### Scenario: Resolve conflict manually
- **WHEN** user reviews conflict
- **THEN** options to keep local, keep server, or merge are provided

#### Scenario: Auto-resolve non-conflicting
- **WHEN** offline operation doesn't conflict with server changes
- **THEN** operation is applied automatically without user intervention

### Requirement: Push notification handling
The mobile app SHALL receive and display push notifications for warehouse operations.

#### Scenario: Receive notification in background
- **WHEN** push notification arrives while app backgrounded
- **THEN** system notification displayed in tray

#### Scenario: Tap notification to navigate
- **WHEN** user taps pick list notification
- **THEN** app opens to pick list detail screen

#### Scenario: Notification permission prompt
- **WHEN** app launches first time
- **THEN** notification permission is requested with explanation
