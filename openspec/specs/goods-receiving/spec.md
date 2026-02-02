## ADDED Requirements

### Requirement: Goods received note creation
The system SHALL allow creating GRN against purchase orders.

#### Scenario: Create GRN from PO
- **WHEN** user creates GRN referencing PO
- **THEN** system creates GRN with PO line items, user enters received quantities

#### Scenario: Auto-generate GRN number
- **WHEN** GRN is created
- **THEN** system assigns next number in sequence (e.g., GRN-202601-00001)

### Requirement: Direct goods receiving
The system SHALL allow receiving goods without PO (for unexpected deliveries or small purchases).

#### Scenario: Create direct GRN
- **WHEN** user creates GRN without PO reference
- **THEN** system allows entering vendor, items, and quantities manually

### Requirement: GRN line items
The system SHALL track received items with quantity, bin location, and condition.

#### Scenario: Enter received quantity
- **WHEN** user enters received quantity for PO line
- **THEN** system validates against ordered quantity

#### Scenario: Assign bin location
- **WHEN** user assigns bin location for received items
- **THEN** stock is added to that specific bin

#### Scenario: Use default bin
- **WHEN** user doesn't specify bin
- **THEN** system uses item's default bin in warehouse

### Requirement: Partial receiving
The system SHALL allow receiving partial quantities against PO.

#### Scenario: Receive partial
- **WHEN** PO has 100 units ordered, user receives 60
- **THEN** GRN records 60, PO shows 60/100 received, remaining is open

#### Scenario: Multiple GRNs per PO
- **WHEN** vendor delivers in batches
- **THEN** system allows multiple GRNs against same PO

### Requirement: Over-receiving handling
The system SHALL warn when received quantity exceeds ordered quantity but allow with confirmation.

#### Scenario: Receive over order
- **WHEN** user enters received qty 110 for ordered qty 100
- **THEN** system warns "Exceeds ordered quantity by 10", requires confirmation

### Requirement: Receiving discrepancy handling
The system SHALL allow flagging and noting discrepancies during receiving.

#### Scenario: Record discrepancy
- **WHEN** user notes "5 units damaged on arrival"
- **THEN** system records discrepancy note on GRN line

#### Scenario: Reject quantity
- **WHEN** user rejects 5 damaged units
- **THEN** system records rejected qty separately, only good qty added to stock

### Requirement: Stock update on receiving
The system SHALL automatically update stock levels when GRN is confirmed.

#### Scenario: Stock increase
- **WHEN** GRN is confirmed with 100 units received
- **THEN** warehouse stock increases by 100 units

#### Scenario: Stock by bin
- **WHEN** GRN specifies bin location A-01-02
- **THEN** stock in that bin increases accordingly

### Requirement: Cost update on receiving
The system SHALL update item cost based on received price (weighted average or FIFO based on settings).

#### Scenario: Update weighted average
- **WHEN** item received at different price than current cost
- **THEN** system recalculates weighted average cost

### Requirement: GRN status management
The system SHALL track GRN status: Draft, Confirmed.

#### Scenario: Create as draft
- **WHEN** GRN is created
- **THEN** status is Draft, stock not yet updated

#### Scenario: Confirm GRN
- **WHEN** user confirms GRN
- **THEN** status changes to Confirmed, stock is updated

### Requirement: GRN printing
The system SHALL generate printable GRN document.

#### Scenario: Print GRN
- **WHEN** user prints GRN
- **THEN** system generates PDF with received items, quantities, and bins

### Requirement: Vendor delivery note reference
The system SHALL store vendor's delivery note number for matching.

#### Scenario: Store delivery note
- **WHEN** user enters vendor DO number "VDO-12345"
- **THEN** reference is stored for bill matching

### Requirement: GRN to bill linking
The system SHALL support creating purchase bills from GRN.

#### Scenario: Create bill from GRN
- **WHEN** user creates bill from GRN
- **THEN** system pre-fills bill with GRN details

### Requirement: Receiving inspection
The system SHALL support quality inspection workflow during receiving.

#### Scenario: Mark for inspection
- **WHEN** item requires inspection
- **THEN** user can mark items as pending inspection, quarantine stock

#### Scenario: Complete inspection
- **WHEN** inspection passes
- **THEN** quarantine stock is released to available stock

### Requirement: Batch assignment at receiving
The system SHALL allow assigning batch numbers during goods receiving.

#### Scenario: Assign batch number
- **WHEN** user enters batch number "BATCH-2026-001" for received items
- **THEN** system creates batch record linked to received stock

#### Scenario: Record expiry date
- **WHEN** batch has expiry date
- **THEN** user enters date, system tracks for expiry alerts

### Requirement: GRN listing and filtering
The system SHALL provide list view with filters for date range, vendor, and PO.

#### Scenario: List recent GRNs
- **WHEN** user calls GET /goods-received
- **THEN** system returns paginated list of GRNs

#### Scenario: Filter by PO
- **WHEN** user calls GET /goods-received?po_id=123
- **THEN** system returns GRNs against that PO

### Requirement: GRN editing
The system SHALL allow editing draft GRNs but not confirmed GRNs.

#### Scenario: Edit draft GRN
- **WHEN** user modifies draft GRN quantities
- **THEN** system saves changes

#### Scenario: Edit confirmed GRN
- **WHEN** user attempts to edit confirmed GRN
- **THEN** system returns error "Cannot edit confirmed GRN"

### Requirement: GRN reversal
The system SHALL allow reversing confirmed GRN with reason.

#### Scenario: Reverse GRN
- **WHEN** user reverses GRN due to error
- **THEN** system creates reversal entry, stock is deducted
