## ADDED Requirements

### Requirement: Invoice creation from sales order
The system SHALL allow creating invoices from shipped sales orders.

#### Scenario: Create invoice from SO
- **WHEN** user creates invoice for shipped sales order
- **THEN** system generates invoice number, copies line items, and links to SO

#### Scenario: Auto-populate from SO
- **WHEN** invoice is created from SO
- **THEN** customer, items, quantities, prices, and tax are copied from SO

### Requirement: Direct invoice creation
The system SHALL allow creating invoices directly without sales order (for walk-in/cash sales).

#### Scenario: Create direct invoice
- **WHEN** user creates invoice with customer and line items
- **THEN** system creates invoice and deducts stock immediately

### Requirement: Invoice number generation
The system SHALL auto-generate invoice numbers with configurable prefix (e.g., INV-202601-00001).

#### Scenario: Generate invoice number
- **WHEN** invoice is created
- **THEN** system assigns next number in sequence

### Requirement: Invoice line items
The system SHALL support line items with item, quantity, unit price, discount, and tax.

#### Scenario: Calculate line total
- **WHEN** line has quantity 5, price RM 100, 10% discount
- **THEN** line total is RM 450 before tax

#### Scenario: Calculate line tax
- **WHEN** line total is RM 450 with 10% tax
- **THEN** tax amount is RM 45, line total with tax is RM 495

### Requirement: Invoice tax calculation
The system SHALL calculate tax per Malaysian GST/SST requirements with tax summary.

#### Scenario: Tax summary
- **WHEN** invoice has items with different tax rates
- **THEN** system shows tax breakdown by rate in summary

#### Scenario: Tax-inclusive pricing
- **WHEN** organization uses tax-inclusive pricing
- **THEN** system extracts tax from prices for reporting

### Requirement: Invoice due date calculation
The system SHALL calculate due date based on customer's payment terms.

#### Scenario: Net 30 terms
- **WHEN** invoice date is Jan 1 and customer has Net 30 terms
- **THEN** due date is Jan 31

#### Scenario: COD terms
- **WHEN** customer has COD terms
- **THEN** due date equals invoice date

### Requirement: Invoice status management
The system SHALL track invoice status: Draft, Sent, Partially Paid, Paid, Overdue, Void.

#### Scenario: Initial status
- **WHEN** invoice is created
- **THEN** status is Draft

#### Scenario: Mark as sent
- **WHEN** user sends invoice to customer
- **THEN** status changes to Sent

#### Scenario: Automatic overdue
- **WHEN** due date passes and balance remains
- **THEN** status changes to Overdue

#### Scenario: Paid status
- **WHEN** full amount is received
- **THEN** status changes to Paid

### Requirement: Invoice sending
The system SHALL allow sending invoices to customers via email.

#### Scenario: Send invoice email
- **WHEN** user sends invoice to customer
- **THEN** system emails PDF invoice to customer's email address

### Requirement: Invoice PDF generation
The system SHALL generate professional PDF invoices with company branding, line items, totals, and payment terms.

#### Scenario: Generate PDF
- **WHEN** user requests invoice PDF
- **THEN** system generates PDF with logo, address, line items, tax summary, and terms

### Requirement: Invoice payment recording
The system SHALL allow recording payments against invoices.

#### Scenario: Record full payment
- **WHEN** user records payment of RM 1000 against RM 1000 invoice
- **THEN** invoice status changes to Paid, payment linked to invoice

#### Scenario: Record partial payment
- **WHEN** user records payment of RM 500 against RM 1000 invoice
- **THEN** invoice status changes to Partially Paid, balance shows RM 500

### Requirement: Multiple payment methods
The system SHALL support payment methods: Cash, Cheque, Bank Transfer, Credit Card.

#### Scenario: Record cash payment
- **WHEN** user records cash payment
- **THEN** system saves payment with method "Cash"

#### Scenario: Record cheque payment
- **WHEN** user records cheque payment
- **THEN** system saves cheque number and bank details

### Requirement: Payment receipt generation
The system SHALL generate payment receipts upon recording payment.

#### Scenario: Generate receipt
- **WHEN** payment is recorded
- **THEN** system generates printable receipt with payment details

### Requirement: Invoice voiding
The system SHALL allow voiding invoices with reason. Voided invoices SHALL restore stock if applicable.

#### Scenario: Void invoice
- **WHEN** user voids unpaid invoice with reason "Customer cancelled"
- **THEN** invoice status changes to Void, stock is restored if direct invoice

#### Scenario: Void paid invoice
- **WHEN** user attempts to void invoice with payments
- **THEN** system returns error "Cannot void invoice with payments, create credit note instead"

### Requirement: Invoice listing and filtering
The system SHALL provide invoice list with filters for status, date range, customer, and payment status.

#### Scenario: List overdue invoices
- **WHEN** user calls GET /invoices?status=overdue
- **THEN** system returns all overdue invoices

#### Scenario: Filter by customer
- **WHEN** user calls GET /invoices?customer_id=123
- **THEN** system returns invoices for that customer

### Requirement: Invoice aging report
The system SHALL calculate invoice aging for receivables tracking.

#### Scenario: Calculate aging
- **WHEN** user views invoice aging
- **THEN** system shows buckets: Current, 1-30 days, 31-60 days, 61-90 days, 90+ days

### Requirement: Invoice notes
The system SHALL support notes that appear on printed invoice.

#### Scenario: Add invoice note
- **WHEN** user adds note "Thank you for your business"
- **THEN** note appears at bottom of invoice PDF

### Requirement: Early payment discount
The system SHALL support early payment discounts (e.g., 2% if paid within 10 days).

#### Scenario: Apply early payment discount
- **WHEN** customer pays RM 980 within discount period for RM 1000 invoice (2% discount)
- **THEN** system accepts as full payment, marks invoice as Paid
