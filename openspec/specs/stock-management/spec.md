## ADDED Requirements

### Requirement: Stock adjustment creation
The system SHALL allow creating stock adjustments to correct inventory levels.

#### Scenario: Create adjustment
- **WHEN** user creates stock adjustment with warehouse, items, and quantities
- **THEN** system generates adjustment number and saves in draft status

#### Scenario: Auto-generate adjustment number
- **WHEN** adjustment is created
- **THEN** system assigns next number in sequence (e.g., ADJ-202601-00001)

### Requirement: Adjustment types
The system SHALL support adjustment types: Opening Stock, Write-off, Write-in, Damage, Count Adjustment.

#### Scenario: Opening stock adjustment
- **WHEN** user creates Opening Stock adjustment
- **THEN** system sets initial stock levels without affecting history

#### Scenario: Write-off adjustment
- **WHEN** user creates Write-off for 10 damaged units
- **THEN** system reduces stock by 10 with reason "Write-off"

#### Scenario: Write-in adjustment
- **WHEN** user creates Write-in for 5 found units
- **THEN** system increases stock by 5 with reason "Write-in"

### Requirement: Adjustment reason codes
The system SHALL require reason code for adjustments with customizable reasons.

#### Scenario: Select reason
- **WHEN** user creates adjustment
- **THEN** system requires selection from: Damaged, Expired, Lost, Found, Theft, Error Correction, Other

#### Scenario: Add notes
- **WHEN** user selects reason and adds notes
- **THEN** additional context is stored with adjustment

### Requirement: Stock adjustment confirmation
The system SHALL require confirmation to apply adjustment. Draft adjustments do not affect stock.

#### Scenario: Confirm adjustment
- **WHEN** user confirms adjustment
- **THEN** stock levels are updated, adjustment is locked

#### Scenario: Draft adjustment
- **WHEN** adjustment is in draft status
- **THEN** stock levels are unchanged

### Requirement: Adjustment approval workflow
The system SHALL optionally require manager approval for adjustments above threshold value.

#### Scenario: Below threshold
- **WHEN** adjustment value is below RM 1000 threshold
- **THEN** user can confirm directly

#### Scenario: Above threshold
- **WHEN** adjustment value exceeds RM 1000 threshold
- **THEN** adjustment requires manager approval before confirmation

### Requirement: Stock count creation
The system SHALL allow creating stock counts for physical inventory verification.

#### Scenario: Create full count
- **WHEN** user creates full stock count for warehouse
- **THEN** system generates count sheet with all items and system quantities

#### Scenario: Create cycle count
- **WHEN** user creates cycle count for category "Brake Parts"
- **THEN** system generates count sheet with items in that category only

### Requirement: Count sheet generation
The system SHALL generate printable count sheets sorted by bin location.

#### Scenario: Generate count sheet
- **WHEN** user prints count sheet
- **THEN** system generates PDF with item, bin, system qty, and blank for counted qty

#### Scenario: Sort by location
- **WHEN** generating count sheet
- **THEN** items are sorted by bin location for efficient counting

### Requirement: Count entry
The system SHALL allow entering counted quantities per item and bin.

#### Scenario: Enter counted quantity
- **WHEN** user enters counted quantity for item
- **THEN** system calculates variance from system quantity

#### Scenario: Bulk entry
- **WHEN** user enters multiple counts
- **THEN** system saves all entries together

### Requirement: Variance calculation
The system SHALL calculate quantity and value variance between system and counted stock.

#### Scenario: Calculate variance
- **WHEN** system qty is 100, counted qty is 95
- **THEN** variance is -5 units with calculated value impact

#### Scenario: Variance report
- **WHEN** count is complete
- **THEN** system generates variance report showing all discrepancies

### Requirement: Count adjustment generation
The system SHALL generate stock adjustments from approved count variances.

#### Scenario: Generate adjustments
- **WHEN** manager approves count variances
- **THEN** system creates adjustment to reconcile system to counted quantities

### Requirement: Stock count status
The system SHALL track count status: Draft, In Progress, Completed, Cancelled.

#### Scenario: Status progression
- **WHEN** count is created
- **THEN** status is Draft
- **WHEN** counting begins
- **THEN** status is In Progress
- **WHEN** all items counted and approved
- **THEN** status is Completed

### Requirement: Stock freeze during count
The system SHALL optionally freeze stock movements for items being counted.

#### Scenario: Enable freeze
- **WHEN** user enables freeze for count
- **THEN** sales and receiving for those items are blocked during count

#### Scenario: Warning without freeze
- **WHEN** count is in progress without freeze
- **THEN** system warns that movements may affect accuracy

### Requirement: Stock movement history
The system SHALL maintain complete history of all stock movements.

#### Scenario: View movement history
- **WHEN** user calls GET /stock/movements
- **THEN** system returns all stock movements with type, quantity, reference, and timestamp

#### Scenario: Filter by item
- **WHEN** user calls GET /stock/movements?item_id=123
- **THEN** system returns movements for that item

#### Scenario: Filter by type
- **WHEN** user calls GET /stock/movements?type=sale
- **THEN** system returns only sales-related movements

### Requirement: Stock valuation
The system SHALL calculate stock value using configured method (Weighted Average or FIFO).

#### Scenario: Calculate valuation
- **WHEN** user views stock valuation report
- **THEN** system calculates total value using weighted average cost

### Requirement: Stock transfer creation
The system SHALL allow creating transfers between warehouses.

#### Scenario: Create transfer
- **WHEN** user creates transfer from Warehouse A to Warehouse B for 50 units
- **THEN** system creates transfer order in draft status

#### Scenario: Auto-generate transfer number
- **WHEN** transfer is created
- **THEN** system assigns number (e.g., TRF-202601-00001)

### Requirement: Transfer status lifecycle
The system SHALL track transfer status: Draft, In Transit, Completed, Cancelled.

#### Scenario: Issue transfer
- **WHEN** user issues transfer
- **THEN** stock is deducted from source warehouse, status is In Transit

#### Scenario: Receive transfer
- **WHEN** destination warehouse receives transfer
- **THEN** stock is added to destination, status is Completed

### Requirement: In-transit stock tracking
The system SHALL track stock in transit between warehouses.

#### Scenario: View in-transit
- **WHEN** user views warehouse stock
- **THEN** system shows in-transit incoming and outgoing quantities

### Requirement: Stock adjustment listing
The system SHALL provide list view with filters for type, date, and status.

#### Scenario: List adjustments
- **WHEN** user calls GET /stock/adjustments
- **THEN** system returns paginated list of adjustments

#### Scenario: Filter by type
- **WHEN** user calls GET /stock/adjustments?type=write_off
- **THEN** system returns only write-off adjustments
