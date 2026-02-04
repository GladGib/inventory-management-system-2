## ADDED Requirements

### Requirement: Organization logo upload
The system SHALL allow organization administrators to upload a logo image for their organization. The logo SHALL be displayed on invoices, purchase orders, and other generated documents.

#### Scenario: Successful logo upload
- **WHEN** admin uploads a valid image file (PNG, JPG, JPEG) under 2MB
- **THEN** system stores the file and updates organization logo reference
- **AND** logo is immediately available for document generation

#### Scenario: Invalid file type rejected
- **WHEN** admin attempts to upload a non-image file (PDF, DOC, etc.)
- **THEN** system rejects the upload with error "Only PNG, JPG, and JPEG files are allowed"

#### Scenario: File too large rejected
- **WHEN** admin attempts to upload an image larger than 2MB
- **THEN** system rejects the upload with error "File size must be under 2MB"

### Requirement: Item image upload
The system SHALL allow users to upload product images for inventory items. Each item MAY have up to 5 images.

#### Scenario: Successful item image upload
- **WHEN** user uploads a valid image file (PNG, JPG, JPEG, WebP) under 5MB for an item
- **THEN** system stores the file and associates it with the item
- **AND** image is displayed in item detail views

#### Scenario: Multiple images per item
- **WHEN** user uploads additional images for an item that already has images
- **THEN** system adds the new image to the item's image collection
- **AND** user can reorder images to set primary image

#### Scenario: Maximum images limit enforced
- **WHEN** user attempts to upload a 6th image for an item that already has 5 images
- **THEN** system rejects the upload with error "Maximum 5 images per item"

#### Scenario: Image deletion
- **WHEN** user deletes an item image
- **THEN** system removes the file reference from the item
- **AND** file is marked for cleanup

### Requirement: File storage management
The system SHALL organize uploaded files by organization and type, ensuring proper isolation and retrieval.

#### Scenario: File organization structure
- **WHEN** a file is uploaded
- **THEN** system stores it at path `/uploads/{orgId}/{type}/{uuid}-{filename}`
- **AND** file metadata is stored in database with original name, size, mime type

#### Scenario: File retrieval with authorization
- **WHEN** user requests a file
- **THEN** system verifies user belongs to the file's organization
- **AND** returns the file with proper content-type header

#### Scenario: Unauthorized file access blocked
- **WHEN** user from organization A requests a file belonging to organization B
- **THEN** system returns 403 Forbidden error

### Requirement: File upload UI components
The web application SHALL provide consistent file upload UI components with drag-and-drop support.

#### Scenario: Drag and drop upload
- **WHEN** user drags a file onto the upload zone
- **THEN** system shows visual feedback indicating drop area
- **AND** processes the file on drop

#### Scenario: Upload progress indication
- **WHEN** file upload is in progress
- **THEN** system displays upload progress percentage
- **AND** allows user to cancel the upload

#### Scenario: Image preview before upload
- **WHEN** user selects an image file
- **THEN** system displays a preview of the image
- **AND** allows user to confirm or cancel before uploading
