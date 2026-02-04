# credit-notes Specification

## Purpose
TBD - created by archiving change phase-2-continuation. Update Purpose after archive.
## Requirements
### Requirement: Generate sales credit note from return
The system SHALL generate a credit note when a sales return is approved, recording the credit amount.

#### Scenario: Generate credit note for approved return
- **WHEN** sales return is approved with items and amounts
- **THEN** system creates credit note with unique CN number linked to the return

#### Scenario: Credit note reflects return amounts
- **WHEN** credit note is generated
- **THEN** credit note amount matches the return value including any adjustments

### Requirement: Apply credit note to invoice
The system SHALL allow users to apply a credit note to reduce an outstanding invoice balance.

#### Scenario: Apply full credit note
- **WHEN** user applies credit note amount equal to or less than invoice balance
- **THEN** system reduces invoice balance and marks credit note as applied

#### Scenario: Partial credit application
- **WHEN** credit note amount exceeds invoice balance
- **THEN** system applies partial amount and leaves remaining credit available

### Requirement: Credit note PDF generation
The system SHALL generate a printable credit note PDF.

#### Scenario: Generate credit note PDF
- **WHEN** user requests credit note PDF
- **THEN** system returns PDF with credit note details, linked return, and amounts

### Requirement: Credit note view and print in web UI
The web application SHALL display credit note details and allow printing.

#### Scenario: View credit note details
- **WHEN** user navigates to credit note detail page
- **THEN** system displays credit note information with linked return and application history

#### Scenario: Print credit note
- **WHEN** user clicks print/download on credit note page
- **THEN** system generates and downloads credit note PDF

### Requirement: Vendor credit notes from purchase returns
The system SHALL record vendor credit notes received for purchase returns.

#### Scenario: Create vendor credit note
- **WHEN** user records vendor credit note for a purchase return
- **THEN** system creates vendor credit record linked to the return

#### Scenario: Apply vendor credit to bill
- **WHEN** user applies vendor credit to outstanding bill
- **THEN** system reduces bill balance by credit amount

