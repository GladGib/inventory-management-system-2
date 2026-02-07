# file-uploads Specification

## Purpose
TBD - created by archiving change phase-3-complete. Update Purpose after archive.
## Requirements
### Requirement: Organization logo upload
The system SHALL allow organization administrators to upload a logo image for their organization. The logo SHALL be validated for file type (PNG, JPG, JPEG, GIF, WebP) and size (max 2MB). The logo SHALL be stored on the filesystem and served via a public URL.

#### Scenario: Successful logo upload
- **WHEN** admin uploads a valid PNG file under 2MB via POST /api/organizations/:id/logo
- **THEN** system stores the file and returns the public URL for the logo

#### Scenario: Invalid file type rejected
- **WHEN** admin uploads a PDF file as logo
- **THEN** system returns 400 error with message "Invalid file type. Allowed: png, jpg, jpeg, gif, webp"

#### Scenario: File too large rejected
- **WHEN** admin uploads a 5MB image file
- **THEN** system returns 400 error with message "File too large. Maximum size: 2MB"

### Requirement: Item image upload
The system SHALL allow users to upload images for inventory items. Each item MAY have multiple images. Images SHALL be validated for file type (PNG, JPG, JPEG, WebP) and size (max 5MB per image).

#### Scenario: Successful item image upload
- **WHEN** user uploads a valid JPG file via POST /api/items/:id/images
- **THEN** system stores the image and returns the image record with public URL

#### Scenario: Multiple images per item
- **WHEN** user uploads three images to an item
- **THEN** all three images are stored and associated with the item

#### Scenario: Delete item image
- **WHEN** user sends DELETE /api/items/:id/images/:imageId
- **THEN** system removes the image record and deletes the file from storage

### Requirement: File storage configuration
The system SHALL store uploaded files in a configurable directory specified by the UPLOAD_DIR environment variable. Files SHALL be organized by type (logos/, items/) and include unique filenames to prevent collisions.

#### Scenario: Files stored in configured directory
- **WHEN** UPLOAD_DIR is set to "/data/uploads"
- **THEN** uploaded files are stored under /data/uploads/logos/ and /data/uploads/items/

#### Scenario: Unique filename generation
- **WHEN** two files with the same original name are uploaded
- **THEN** each file gets a unique filename using UUID prefix

### Requirement: Static file serving
The system SHALL serve uploaded files via a public endpoint at /uploads/*. The endpoint SHALL set appropriate cache headers and content-type headers.

#### Scenario: Serve uploaded image
- **WHEN** client requests GET /uploads/items/abc123.jpg
- **THEN** system returns the image with Content-Type: image/jpeg and Cache-Control header

### Requirement: Logo upload UI
The web application SHALL provide a logo upload interface in organization settings. The interface SHALL support drag-and-drop, show upload progress, and display a preview after upload.

#### Scenario: Drag and drop logo upload
- **WHEN** user drags a PNG file onto the upload zone in organization settings
- **THEN** file is uploaded and preview is displayed

#### Scenario: Upload progress indicator
- **WHEN** user uploads a large image
- **THEN** progress bar shows upload percentage until complete

### Requirement: Item image upload UI
The web application SHALL provide an image upload interface on the item edit page. Users SHALL be able to upload multiple images, reorder them, and delete existing images.

#### Scenario: Upload multiple item images
- **WHEN** user selects multiple images in file picker
- **THEN** all selected images are uploaded and displayed in gallery

#### Scenario: Delete item image from UI
- **WHEN** user clicks delete button on an image thumbnail
- **THEN** image is removed from item after confirmation

