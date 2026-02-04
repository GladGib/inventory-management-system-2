## ADDED Requirements

### Requirement: PDF export for reports
The system SHALL allow users to export any report as a PDF document with proper formatting and branding.

#### Scenario: Stock valuation PDF export
- **WHEN** user clicks PDF export on stock valuation report
- **THEN** system generates and downloads a PDF with current stock values by category

#### Scenario: Sales by customer PDF export
- **WHEN** user clicks PDF export on sales by customer report
- **THEN** system generates and downloads a PDF with sales data for the selected period

### Requirement: Excel export for reports
The system SHALL allow users to export any report as an Excel spreadsheet for further analysis.

#### Scenario: Stock valuation Excel export
- **WHEN** user clicks Excel export on stock valuation report
- **THEN** system generates and downloads an XLSX file with stock data in tabular format

#### Scenario: Sales by customer Excel export
- **WHEN** user clicks Excel export on sales by customer report
- **THEN** system generates and downloads an XLSX file with sales data and subtotals

### Requirement: Export progress indication
The system SHALL show a loading indicator while generating export files to provide user feedback.

#### Scenario: Large report export
- **WHEN** user initiates export of a large report
- **THEN** system shows a loading spinner until the file is ready for download

### Requirement: Export date range filtering
The system SHALL apply the current report filters to exported data ensuring consistency between displayed and exported data.

#### Scenario: Filtered export
- **WHEN** user exports a report with date filters applied
- **THEN** the exported file contains only data matching the applied filters
