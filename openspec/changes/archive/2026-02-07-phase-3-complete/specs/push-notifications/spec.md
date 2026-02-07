## ADDED Requirements

### Requirement: FCM integration setup
The mobile application SHALL integrate Firebase Cloud Messaging (FCM) for push notifications. The app SHALL request notification permissions on first launch and register the device token with the backend.

#### Scenario: Permission request on launch
- **WHEN** user launches app for first time
- **THEN** system prompts for notification permission

#### Scenario: Token registration
- **WHEN** user grants permission and is logged in
- **THEN** app sends FCM token to backend via POST /api/devices/register

#### Scenario: Token refresh handling
- **WHEN** FCM token is refreshed by Firebase
- **THEN** app automatically updates token on backend

### Requirement: Device token management
The backend SHALL store device tokens associated with user accounts. Each user MAY have multiple devices. Tokens SHALL be invalidated on logout.

#### Scenario: Store device token
- **WHEN** POST /api/devices/register with {token, platform, deviceName}
- **THEN** system stores token linked to authenticated user

#### Scenario: Multiple devices per user
- **WHEN** user logs in on phone and tablet
- **THEN** both device tokens are stored and both receive notifications

#### Scenario: Logout invalidates token
- **WHEN** user logs out of mobile app
- **THEN** device token is removed from backend

### Requirement: Warehouse operation notifications
The system SHALL send push notifications for key warehouse operations: new pick lists assigned, low stock alerts, and receiving completion.

#### Scenario: New pick list notification
- **WHEN** pick list is created and assigned to warehouse
- **THEN** warehouse workers receive notification "New pick list #123 ready"

#### Scenario: Low stock alert
- **WHEN** item stock falls below reorder point
- **THEN** notification sent to users with inventory management role

#### Scenario: Receiving completed notification
- **WHEN** GRN is completed
- **THEN** notification sent to purchaser who created the PO

### Requirement: Notification preferences
Users SHALL be able to configure which notifications they receive. Preferences SHALL be stored per user and respected when sending notifications.

#### Scenario: Disable pick list notifications
- **WHEN** user disables pick list notifications in settings
- **THEN** user stops receiving pick list notifications

#### Scenario: Notification preferences API
- **WHEN** GET /api/users/me/notification-preferences
- **THEN** system returns current notification preference settings

### Requirement: Notification delivery tracking
The backend SHALL track notification delivery status. Failed deliveries SHALL be logged and invalid tokens SHALL be automatically removed.

#### Scenario: Track delivery success
- **WHEN** notification is sent successfully
- **THEN** system logs delivery with timestamp

#### Scenario: Handle invalid token
- **WHEN** FCM returns "invalid token" error
- **THEN** system removes token from database

### Requirement: Mobile notification display
The mobile app SHALL display notifications appropriately when app is in foreground, background, and terminated states.

#### Scenario: Foreground notification
- **WHEN** notification arrives while app is open
- **THEN** in-app banner displays with notification content

#### Scenario: Background notification
- **WHEN** notification arrives while app is backgrounded
- **THEN** system notification appears in notification tray

#### Scenario: Notification tap action
- **WHEN** user taps notification
- **THEN** app opens to relevant screen (e.g., pick list detail)
