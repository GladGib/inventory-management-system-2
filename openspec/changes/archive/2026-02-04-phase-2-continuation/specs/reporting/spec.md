## ADDED Requirements

### Requirement: PDF/Excel export buttons for all reports
The web application SHALL provide export buttons on all report pages.

#### Scenario: Export report to Excel
- **WHEN** user clicks Excel export button on report page
- **THEN** system downloads Excel file with report data

#### Scenario: Export report to PDF
- **WHEN** user clicks PDF export button on report page
- **THEN** system downloads PDF file with formatted report

#### Scenario: Export with current filters
- **WHEN** user exports while filters are applied
- **THEN** system exports only the filtered data

### Requirement: Stock valuation report export
The stock valuation report page SHALL include export functionality.

#### Scenario: Export stock valuation to Excel
- **WHEN** user exports stock valuation report
- **THEN** system downloads Excel with item, quantity, cost, and total value columns

### Requirement: Sales by customer report export
The sales by customer report page SHALL include export functionality.

#### Scenario: Export sales by customer to Excel
- **WHEN** user exports sales by customer report
- **THEN** system downloads Excel with customer, order count, and total sales columns

### Requirement: Consistent export UX
All report pages SHALL have consistent export button placement and behavior.

#### Scenario: Export button placement
- **WHEN** user views any report page
- **THEN** export buttons appear in consistent location (top right of report)

#### Scenario: Export loading state
- **WHEN** export is in progress
- **THEN** system displays loading indicator on export button
