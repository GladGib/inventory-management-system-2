## ADDED Requirements

### Requirement: Organization logo management
Organizations SHALL support logo images. The logo SHALL be displayed in reports, invoices, and web application header.

#### Scenario: Upload organization logo
- **WHEN** POST /api/organizations/:id/logo with image file
- **THEN** logo is stored and organization record updated with logo URL

#### Scenario: Logo displayed on invoices
- **WHEN** generating invoice PDF for organization with logo
- **THEN** logo appears in invoice header

#### Scenario: Delete organization logo
- **WHEN** DELETE /api/organizations/:id/logo
- **THEN** logo file is deleted and organization logo URL cleared

#### Scenario: Logo on web header
- **WHEN** user views web application with organization logo configured
- **THEN** logo displays in application header/sidebar
