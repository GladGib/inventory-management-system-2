## ADDED Requirements

### Requirement: Stock summary report
The system SHALL provide stock summary report showing current stock levels by item and warehouse.

#### Scenario: Generate stock summary
- **WHEN** user requests stock summary report
- **THEN** system returns all items with on-hand, committed, available, and on-order quantities

#### Scenario: Filter by warehouse
- **WHEN** user filters by warehouse
- **THEN** report shows only items in selected warehouse

#### Scenario: Filter by category
- **WHEN** user filters by category
- **THEN** report shows only items in selected category

### Requirement: Stock valuation report
The system SHALL provide stock valuation report showing inventory value by item.

#### Scenario: Generate valuation report
- **WHEN** user requests stock valuation report
- **THEN** system returns items with quantity, unit cost, and total value

#### Scenario: Valuation by warehouse
- **WHEN** user selects warehouse
- **THEN** report shows value breakdown by warehouse

### Requirement: Low stock report
The system SHALL provide report of items at or below reorder point.

#### Scenario: Generate low stock report
- **WHEN** user requests low stock report
- **THEN** system returns items where current stock <= reorder point

#### Scenario: Include reorder info
- **WHEN** report is generated
- **THEN** each item shows reorder point, reorder qty, preferred vendor

### Requirement: Stock aging report
The system SHALL provide stock aging report showing how long items have been in inventory.

#### Scenario: Generate aging report
- **WHEN** user requests stock aging report
- **THEN** system calculates age based on last receipt date and shows aging buckets

### Requirement: Stock movement report
The system SHALL provide report of stock movements for a date range.

#### Scenario: Generate movement report
- **WHEN** user requests movement report for January
- **THEN** system returns all movements with date, type, item, quantity, and reference

#### Scenario: Movement by item
- **WHEN** user filters by item
- **THEN** report shows opening, receipts, issues, adjustments, and closing for that item

### Requirement: Sales summary report
The system SHALL provide sales summary report showing total sales by period.

#### Scenario: Generate sales summary
- **WHEN** user requests sales summary for January
- **THEN** system returns total sales value, invoice count, and payment collected

#### Scenario: Daily breakdown
- **WHEN** user selects daily breakdown
- **THEN** report shows sales totals per day

### Requirement: Sales by customer report
The system SHALL provide sales breakdown by customer.

#### Scenario: Generate customer sales report
- **WHEN** user requests sales by customer
- **THEN** system returns each customer's total sales value and order count

#### Scenario: Sort by value
- **WHEN** user sorts by value descending
- **THEN** top customers appear first

### Requirement: Sales by item report
The system SHALL provide sales breakdown by item.

#### Scenario: Generate item sales report
- **WHEN** user requests sales by item
- **THEN** system returns each item's quantity sold and revenue

#### Scenario: Best sellers
- **WHEN** user views best sellers
- **THEN** items are sorted by quantity or value descending

### Requirement: Sales by category report
The system SHALL provide sales breakdown by item category.

#### Scenario: Generate category sales report
- **WHEN** user requests sales by category
- **THEN** system returns each category's total sales and percentage of total

### Requirement: Outstanding receivables report
The system SHALL provide report of unpaid customer invoices with aging.

#### Scenario: Generate receivables report
- **WHEN** user requests receivables report
- **THEN** system returns unpaid invoices grouped by customer

#### Scenario: Aging buckets
- **WHEN** report is generated
- **THEN** amounts are categorized: Current, 1-30, 31-60, 61-90, 90+ days

### Requirement: Purchase summary report
The system SHALL provide purchase summary report showing total purchases by period.

#### Scenario: Generate purchase summary
- **WHEN** user requests purchase summary for January
- **THEN** system returns total purchase value and PO count

### Requirement: Purchase by vendor report
The system SHALL provide purchase breakdown by vendor.

#### Scenario: Generate vendor purchase report
- **WHEN** user requests purchases by vendor
- **THEN** system returns each vendor's total purchase value

### Requirement: Purchase by item report
The system SHALL provide purchase breakdown by item.

#### Scenario: Generate item purchase report
- **WHEN** user requests purchases by item
- **THEN** system returns each item's quantity purchased and cost

### Requirement: Outstanding payables report
The system SHALL provide report of unpaid vendor bills with aging.

#### Scenario: Generate payables report
- **WHEN** user requests payables report
- **THEN** system returns unpaid bills grouped by vendor

#### Scenario: Aging buckets
- **WHEN** report is generated
- **THEN** amounts are categorized: Current, 1-30, 31-60, 61-90, 90+ days

### Requirement: Profit margin report
The system SHALL provide gross profit analysis by item or category.

#### Scenario: Generate margin report
- **WHEN** user requests profit margin report
- **THEN** system calculates revenue minus cost for each item, showing margin percentage

### Requirement: Report export
The system SHALL allow exporting reports to PDF and Excel formats.

#### Scenario: Export to PDF
- **WHEN** user exports report as PDF
- **THEN** system generates formatted PDF with company branding

#### Scenario: Export to Excel
- **WHEN** user exports report as Excel
- **THEN** system generates XLSX file with data and basic formatting

### Requirement: Report date range selection
The system SHALL allow selecting date ranges for all time-based reports.

#### Scenario: Custom date range
- **WHEN** user selects Jan 1 to Jan 31
- **THEN** report covers only that period

#### Scenario: Preset ranges
- **WHEN** user selects "This Month" or "Last Quarter"
- **THEN** system calculates appropriate date range

### Requirement: Report scheduling
The system SHALL allow scheduling reports to be generated and emailed periodically (Phase 2).

#### Scenario: Schedule daily report
- **WHEN** user schedules daily sales report
- **THEN** system generates and emails report each morning

### Requirement: Dashboard widgets
The system SHALL provide dashboard widgets showing key metrics from reports.

#### Scenario: Today's sales widget
- **WHEN** user views dashboard
- **THEN** widget shows today's sales total, order count, and comparison to yesterday

#### Scenario: Outstanding receivables widget
- **WHEN** user views dashboard
- **THEN** widget shows total outstanding and overdue amounts

#### Scenario: Low stock widget
- **WHEN** user views dashboard
- **THEN** widget shows count of items below reorder point

#### Scenario: Pending orders widget
- **WHEN** user views dashboard
- **THEN** widget shows count of orders pending fulfillment
