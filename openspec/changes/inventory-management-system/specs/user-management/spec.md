## ADDED Requirements

### Requirement: User CRUD operations
The system SHALL allow administrators to create, read, update, and deactivate users within their organization.

#### Scenario: Create user
- **WHEN** administrator creates user with email, name, and role
- **THEN** system creates user, sends welcome email with temporary password, and returns user record

#### Scenario: List users
- **WHEN** user with view permission calls GET /users
- **THEN** system returns paginated list of users in the organization

#### Scenario: Get user by ID
- **WHEN** user calls GET /users/:id
- **THEN** system returns user details including role and permissions

#### Scenario: Update user
- **WHEN** administrator updates user's name, role, or status
- **THEN** system saves changes and returns updated user

#### Scenario: Deactivate user
- **WHEN** administrator sets user status to inactive
- **THEN** user can no longer login; existing sessions are invalidated

#### Scenario: Duplicate email prevention
- **WHEN** administrator creates user with email already in use
- **THEN** system returns HTTP 400 with error message "Email already registered"

### Requirement: Predefined role assignment
The system SHALL provide predefined roles: Administrator, Manager, Sales Staff, Purchasing Staff, Warehouse Staff, Accountant, and Viewer.

#### Scenario: Assign predefined role
- **WHEN** administrator assigns "Sales Staff" role to user
- **THEN** user receives all permissions associated with Sales Staff role

#### Scenario: List available roles
- **WHEN** administrator calls GET /roles
- **THEN** system returns all predefined roles with their permission sets

### Requirement: Role-based permission enforcement
The system SHALL enforce role-based permissions on all API endpoints. Each role defines which actions users can perform on which resources.

#### Scenario: Permission check passes
- **WHEN** user with "sales:create" permission calls POST /sales-orders
- **THEN** system allows the request

#### Scenario: Permission check fails
- **WHEN** user without "sales:create" permission calls POST /sales-orders
- **THEN** system returns HTTP 403 with error message "Insufficient permissions"

### Requirement: Administrator role permissions
The Administrator role SHALL have full access to all features including user management, organization settings, and all transactions.

#### Scenario: Admin full access
- **WHEN** user with Administrator role accesses any endpoint
- **THEN** system grants access without permission check

### Requirement: Manager role permissions
The Manager role SHALL have access to all operational features but limited settings access (cannot manage users or organization settings).

#### Scenario: Manager operational access
- **WHEN** user with Manager role creates sales order
- **THEN** system allows the operation

#### Scenario: Manager settings restriction
- **WHEN** user with Manager role attempts to create new user
- **THEN** system returns HTTP 403

### Requirement: Sales Staff role permissions
The Sales Staff role SHALL have access to customer management, sales orders, invoices, and payment collection only.

#### Scenario: Sales staff authorized actions
- **WHEN** user with Sales Staff role creates sales order, invoice, or records payment
- **THEN** system allows these operations

#### Scenario: Sales staff restricted actions
- **WHEN** user with Sales Staff role attempts to create purchase order
- **THEN** system returns HTTP 403

### Requirement: Purchasing Staff role permissions
The Purchasing Staff role SHALL have access to vendor management, purchase orders, goods receiving, and bills only.

#### Scenario: Purchasing staff authorized actions
- **WHEN** user with Purchasing Staff role creates purchase order or records goods receipt
- **THEN** system allows these operations

### Requirement: Warehouse Staff role permissions
The Warehouse Staff role SHALL have access to stock viewing, pick list processing, goods receiving, stock adjustments, and stock counts only.

#### Scenario: Warehouse staff authorized actions
- **WHEN** user with Warehouse Staff role updates pick list status or creates stock adjustment
- **THEN** system allows these operations

### Requirement: Accountant role permissions
The Accountant role SHALL have access to invoices, bills, payments, and reports only. Cannot create sales or purchase orders.

#### Scenario: Accountant authorized actions
- **WHEN** user with Accountant role records payment or views reports
- **THEN** system allows these operations

### Requirement: Viewer role permissions
The Viewer role SHALL have read-only access to all data except sensitive settings.

#### Scenario: Viewer read access
- **WHEN** user with Viewer role calls any GET endpoint
- **THEN** system returns requested data

#### Scenario: Viewer write restriction
- **WHEN** user with Viewer role attempts any POST/PUT/DELETE operation
- **THEN** system returns HTTP 403

### Requirement: User password change
The system SHALL allow users to change their own password by providing current password and new password.

#### Scenario: Successful password change
- **WHEN** user provides correct current password and valid new password
- **THEN** system updates password and invalidates all existing sessions

#### Scenario: Incorrect current password
- **WHEN** user provides incorrect current password
- **THEN** system returns HTTP 400 with error message "Current password is incorrect"

### Requirement: User profile self-service
The system SHALL allow users to update their own profile (name, phone) but not role or status.

#### Scenario: Update own profile
- **WHEN** user updates their own name via PUT /users/me
- **THEN** system saves changes

#### Scenario: Cannot change own role
- **WHEN** user attempts to change their own role via PUT /users/me
- **THEN** system ignores role field in request
