## ADDED Requirements

### Requirement: Firebase messaging dependency
The mobile app SHALL include firebase_core and firebase_messaging as dependencies. The notification service SHALL use real FCM imports for token registration, permission requests, and message handling.

#### Scenario: FCM initialization on app start
- **WHEN** the mobile app starts
- **THEN** Firebase is initialized and the notification service registers for push notifications

#### Scenario: Android FCM configuration
- **WHEN** building the Android app
- **THEN** the Google Services plugin processes the google-services.json configuration file

#### Scenario: iOS FCM configuration
- **WHEN** building the iOS app
- **THEN** the app includes push notification capabilities and processes GoogleService-Info.plist
