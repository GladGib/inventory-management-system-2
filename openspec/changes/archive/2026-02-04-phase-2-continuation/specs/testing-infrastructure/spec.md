## ADDED Requirements

### Requirement: Goods receiving service unit tests
The backend SHALL have comprehensive unit tests for the goods receiving service.

#### Scenario: Test GRN creation from PO
- **WHEN** unit tests run for goods receiving service
- **THEN** tests verify GRN creation from purchase order

#### Scenario: Test direct GRN creation
- **WHEN** unit tests run for goods receiving service
- **THEN** tests verify direct GRN creation without PO

#### Scenario: Test inventory updates
- **WHEN** unit tests run for goods receiving service
- **THEN** tests verify inventory quantities are updated correctly

### Requirement: User service unit tests
The backend SHALL have comprehensive unit tests for the user service.

#### Scenario: Test user CRUD operations
- **WHEN** unit tests run for user service
- **THEN** tests verify create, read, update, delete operations

#### Scenario: Test user validation
- **WHEN** unit tests run for user service
- **THEN** tests verify email uniqueness and required fields

### Requirement: Organization service unit tests
The backend SHALL have comprehensive unit tests for the organization service.

#### Scenario: Test organization CRUD operations
- **WHEN** unit tests run for organization service
- **THEN** tests verify create, read, update operations

#### Scenario: Test organization settings
- **WHEN** unit tests run for organization service
- **THEN** tests verify settings management

### Requirement: Auth endpoints E2E tests
The backend SHALL have E2E tests for authentication endpoints.

#### Scenario: Test login flow
- **WHEN** E2E tests run for auth
- **THEN** tests verify login with valid credentials returns token

#### Scenario: Test invalid login
- **WHEN** E2E tests run for auth
- **THEN** tests verify invalid credentials return 401

#### Scenario: Test token refresh
- **WHEN** E2E tests run for auth
- **THEN** tests verify token refresh flow

### Requirement: User endpoints E2E tests
The backend SHALL have E2E tests for user management endpoints.

#### Scenario: Test user creation
- **WHEN** E2E tests run for users
- **THEN** tests verify user creation via API

#### Scenario: Test user authorization
- **WHEN** E2E tests run for users
- **THEN** tests verify role-based access control

### Requirement: Items endpoints E2E tests
The backend SHALL have E2E tests for item management endpoints.

#### Scenario: Test item CRUD
- **WHEN** E2E tests run for items
- **THEN** tests verify full CRUD cycle via API

#### Scenario: Test item search
- **WHEN** E2E tests run for items
- **THEN** tests verify search and filtering

### Requirement: Sales order workflow E2E tests
The backend SHALL have E2E tests for complete sales order workflow.

#### Scenario: Test order to invoice flow
- **WHEN** E2E tests run for sales workflow
- **THEN** tests verify order creation, confirmation, and invoicing

#### Scenario: Test payment recording
- **WHEN** E2E tests run for sales workflow
- **THEN** tests verify payment recording and invoice status update
