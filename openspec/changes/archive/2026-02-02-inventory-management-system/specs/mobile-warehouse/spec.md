## ADDED Requirements

### Requirement: Mobile app authentication
The system SHALL allow warehouse staff to login via mobile app using email and password.

#### Scenario: Mobile login
- **WHEN** user enters valid credentials in mobile app
- **THEN** app authenticates and stores tokens securely

#### Scenario: Session persistence
- **WHEN** user reopens app within token validity
- **THEN** app automatically logs in without re-entering credentials

#### Scenario: Logout
- **WHEN** user logs out from mobile app
- **THEN** app clears stored tokens and returns to login screen

### Requirement: Warehouse selection
The system SHALL allow user to select warehouse context for mobile operations.

#### Scenario: Select warehouse
- **WHEN** user selects warehouse from list
- **THEN** all operations are scoped to that warehouse

#### Scenario: Remember selection
- **WHEN** user selects warehouse
- **THEN** app remembers selection for future sessions

### Requirement: Item lookup via search
The system SHALL allow searching items by name, code, or barcode in mobile app.

#### Scenario: Search by name
- **WHEN** user types "brake pad" in search
- **THEN** app shows matching items with stock levels

#### Scenario: Search by code
- **WHEN** user types item code
- **THEN** app shows exact match or close matches

### Requirement: Barcode scanning
The system SHALL support barcode scanning using device camera for item identification.

#### Scenario: Scan item barcode
- **WHEN** user scans item barcode
- **THEN** app shows item details and stock levels

#### Scenario: Unknown barcode
- **WHEN** user scans unrecognized barcode
- **THEN** app shows "Item not found" message

#### Scenario: Scan bin barcode
- **WHEN** user scans bin location barcode
- **THEN** app shows items stored in that bin

### Requirement: Stock lookup
The system SHALL display stock levels by warehouse and bin for scanned/searched items.

#### Scenario: View item stock
- **WHEN** user views item details
- **THEN** app shows on-hand, committed, and available by warehouse

#### Scenario: View bin stock
- **WHEN** user views bin details
- **THEN** app shows all items and quantities in that bin

### Requirement: Pick list viewing
The system SHALL allow viewing assigned pick lists on mobile device.

#### Scenario: View pick lists
- **WHEN** user opens pick list section
- **THEN** app shows list of assigned/open pick lists

#### Scenario: Pick list details
- **WHEN** user selects pick list
- **THEN** app shows items to pick with quantities and bin locations

### Requirement: Pick list processing
The system SHALL allow processing pick lists by scanning items and confirming picks.

#### Scenario: Scan to pick
- **WHEN** user scans item barcode while on pick list
- **THEN** app matches to pick line and prompts for quantity confirmation

#### Scenario: Confirm pick quantity
- **WHEN** user confirms picked quantity
- **THEN** pick line is marked complete, next item is shown

#### Scenario: Short pick
- **WHEN** user enters quantity less than required
- **THEN** app records short pick and prompts for reason

### Requirement: Pick list bin location guidance
The system SHALL guide pickers through optimal bin location sequence.

#### Scenario: Navigate to bin
- **WHEN** pick list is opened
- **THEN** app shows first bin location to visit

#### Scenario: Next location
- **WHEN** current bin is complete
- **THEN** app shows next bin in optimal sequence

### Requirement: Pick list completion
The system SHALL allow completing pick lists and updating order status.

#### Scenario: Complete pick list
- **WHEN** all items are picked
- **THEN** user completes pick list, status syncs to server

### Requirement: Goods receiving on mobile
The system SHALL allow receiving goods against purchase orders via mobile.

#### Scenario: Select PO for receiving
- **WHEN** user opens receiving section
- **THEN** app shows list of open POs awaiting receipt

#### Scenario: Scan received items
- **WHEN** user scans item from PO
- **THEN** app shows expected quantity and prompts for received quantity

#### Scenario: Enter received quantity
- **WHEN** user enters received quantity
- **THEN** app records receipt against PO line

### Requirement: Bin assignment during receiving
The system SHALL allow assigning bin locations during mobile goods receiving.

#### Scenario: Assign bin
- **WHEN** user receives item
- **THEN** app prompts for bin location (scan or select)

#### Scenario: Use default bin
- **WHEN** user accepts default bin
- **THEN** app assigns item's default bin

### Requirement: Complete mobile receiving
The system SHALL allow completing GRN from mobile device.

#### Scenario: Complete GRN
- **WHEN** all items are received
- **THEN** user completes GRN, stock is updated on server

### Requirement: Stock count on mobile
The system SHALL allow conducting stock counts using mobile device.

#### Scenario: Open count session
- **WHEN** user opens stock count
- **THEN** app shows assigned count items or full bin list

#### Scenario: Scan and count
- **WHEN** user scans item/bin
- **THEN** app prompts for counted quantity

#### Scenario: Enter count
- **WHEN** user enters counted quantity
- **THEN** app records count and shows variance if any

#### Scenario: Submit count
- **WHEN** user completes counting
- **THEN** counts are submitted to server for review

### Requirement: Offline operation
The system SHALL allow core operations when device is offline.

#### Scenario: Offline data cache
- **WHEN** device loses connectivity
- **THEN** app continues with cached item data

#### Scenario: Offline picking
- **WHEN** processing pick list offline
- **THEN** app queues pick confirmations for later sync

#### Scenario: Offline receiving
- **WHEN** receiving goods offline
- **THEN** app queues receipt data for later sync

#### Scenario: Offline counting
- **WHEN** counting stock offline
- **THEN** app stores counts locally until sync

### Requirement: Data synchronization
The system SHALL automatically sync data when connectivity is restored.

#### Scenario: Auto sync
- **WHEN** device reconnects to network
- **THEN** app automatically syncs queued operations

#### Scenario: Sync status indicator
- **WHEN** data is pending sync
- **THEN** app shows sync status indicator

#### Scenario: Sync conflict resolution
- **WHEN** server data conflicts with queued operation
- **THEN** app flags for manual resolution

### Requirement: Push notifications
The system SHALL send push notifications for assigned tasks and alerts.

#### Scenario: New pick list notification
- **WHEN** pick list is assigned to user
- **THEN** device receives push notification

#### Scenario: Low stock alert
- **WHEN** item falls below reorder point
- **THEN** relevant users receive notification

### Requirement: Mobile app settings
The system SHALL allow configuring app settings including scan preferences.

#### Scenario: Camera selection
- **WHEN** device has multiple cameras
- **THEN** user can select preferred camera for scanning

#### Scenario: Sound feedback
- **WHEN** user toggles sound setting
- **THEN** app plays/mutes scan success/error sounds

### Requirement: Quick actions
The system SHALL provide quick action buttons for common operations.

#### Scenario: Quick stock lookup
- **WHEN** user taps "Scan Item"
- **THEN** camera opens immediately for barcode scan

#### Scenario: Quick navigation
- **WHEN** user scans item from home screen
- **THEN** app goes directly to item stock details
