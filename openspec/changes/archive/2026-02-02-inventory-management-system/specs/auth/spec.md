## ADDED Requirements

### Requirement: User login with email and password
The system SHALL allow users to authenticate using their email address and password. Upon successful authentication, the system SHALL return a JWT access token and set a refresh token cookie.

#### Scenario: Successful login
- **WHEN** user submits valid email and password
- **THEN** system returns HTTP 200 with access token in response body and refresh token in httpOnly cookie

#### Scenario: Invalid credentials
- **WHEN** user submits incorrect email or password
- **THEN** system returns HTTP 401 with error message "Invalid email or password"

#### Scenario: Inactive user login attempt
- **WHEN** user with inactive status attempts to login
- **THEN** system returns HTTP 401 with error message "Account is inactive"

### Requirement: JWT access token generation
The system SHALL generate JWT access tokens containing user ID, organization ID, role, and permissions. Access tokens SHALL expire after 15 minutes.

#### Scenario: Access token payload
- **WHEN** system generates an access token
- **THEN** token payload contains sub (user ID), org (organization ID), role, permissions array, iat, and exp claims

#### Scenario: Access token expiry
- **WHEN** access token is generated
- **THEN** token exp claim is set to 15 minutes from iat

### Requirement: Refresh token rotation
The system SHALL issue refresh tokens that expire after 7 days. When a refresh token is used, the system SHALL invalidate the old token and issue a new refresh token.

#### Scenario: Token refresh
- **WHEN** client sends valid refresh token to /auth/refresh endpoint
- **THEN** system returns new access token and sets new refresh token cookie

#### Scenario: Expired refresh token
- **WHEN** client sends expired refresh token
- **THEN** system returns HTTP 401 with error message "Refresh token expired"

#### Scenario: Reused refresh token
- **WHEN** client sends a previously used refresh token
- **THEN** system returns HTTP 401 and invalidates all refresh tokens for that user

### Requirement: User logout
The system SHALL allow users to logout, which invalidates their current refresh token.

#### Scenario: Successful logout
- **WHEN** authenticated user calls /auth/logout endpoint
- **THEN** system invalidates refresh token and returns HTTP 200

### Requirement: Password reset request
The system SHALL allow users to request a password reset by providing their email address. The system SHALL send a password reset link valid for 1 hour.

#### Scenario: Password reset request for existing user
- **WHEN** user submits password reset request with registered email
- **THEN** system sends email with reset link and returns HTTP 200

#### Scenario: Password reset request for non-existent email
- **WHEN** user submits password reset request with unregistered email
- **THEN** system returns HTTP 200 (to prevent email enumeration) but does not send email

### Requirement: Password reset completion
The system SHALL allow users to set a new password using a valid reset token.

#### Scenario: Successful password reset
- **WHEN** user submits new password with valid reset token
- **THEN** system updates password, invalidates reset token, and returns HTTP 200

#### Scenario: Invalid reset token
- **WHEN** user submits new password with invalid or expired reset token
- **THEN** system returns HTTP 400 with error message "Invalid or expired reset token"

### Requirement: Protected route authentication
The system SHALL require valid JWT access token for all protected API endpoints. The token MUST be provided in the Authorization header as Bearer token.

#### Scenario: Valid token access
- **WHEN** request includes valid Bearer token in Authorization header
- **THEN** system allows request to proceed to endpoint handler

#### Scenario: Missing token
- **WHEN** request to protected endpoint lacks Authorization header
- **THEN** system returns HTTP 401 with error message "Authentication required"

#### Scenario: Invalid token
- **WHEN** request includes malformed or tampered token
- **THEN** system returns HTTP 401 with error message "Invalid token"

#### Scenario: Expired token
- **WHEN** request includes expired access token
- **THEN** system returns HTTP 401 with error message "Token expired"

### Requirement: Organization context enforcement
The system SHALL automatically scope all database queries to the authenticated user's organization based on the org claim in their JWT.

#### Scenario: Data isolation
- **WHEN** authenticated user makes API request
- **THEN** system only returns or modifies data belonging to user's organization
