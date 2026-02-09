# SPECS.md vs Implementation — Full Audit Report

## Context

A comprehensive audit was performed comparing SPECS.md (1280 lines, 18 sections) against the openspec specs AND the actual codebase implementation. The audit was split into 5 parallel iterations by domain. This report consolidates all findings.

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Critical bugs / data integrity issues** | 4 |
| **High-severity gaps (broken workflows)** | 10 |
| **Medium-severity gaps** | ~35 |
| **Low-severity gaps** | ~25 |
| **Deferred (acknowledged in SPECS.md §6)** | ~15 |

---

## TIER 1: CRITICAL — Must Fix (active bugs / data integrity)

### C-1. Stock Adjustment DTO enum doesn't match Prisma enum
- **File**: `backend/src/modules/inventory/dto/inventory.dto.ts:14-21` vs `schema.prisma:1285-1292`
- **Issue**: DTO has `ADD, SUBTRACT, DAMAGE, THEFT, CORRECTION, OTHER`. Prisma has `OPENING_STOCK, WRITE_OFF, WRITE_IN, DAMAGE, COUNT_ADJUSTMENT, OTHER`. Service casts with `as any`, risking invalid enum values in PostgreSQL.
- **Fix**: Align DTO enum with Prisma enum.

### C-2. Sales Order status enum mismatch between Prisma/DTO/Frontend
- **File**: `schema.prisma:604-613` vs `web/src/app/(dashboard)/sales/orders/[id]/page.tsx:63-79`
- **Issue**: Prisma has `PICKING, PACKED, INVOICED, CLOSED`. Frontend uses `PROCESSING, DELIVERED` instead, and is missing `PACKED` and `INVOICED`. Orders in those states show broken status indicators.
- **Fix**: Align frontend status map with Prisma enum.

### C-3. Shipment creation does NOT deduct inventory
- **File**: `backend/src/modules/sales/shipments.service.ts`
- **Issue**: Shipment updates `shippedQty` but never decrements `StockLevel.onHand`, never releases `committed` quantity, and never creates `StockMovement` OUT records. Inventory remains permanently inflated after shipping.
- **Fix**: Add stock deduction logic on shipment creation.

### C-4. Pick list processing never updates `SalesOrderLine.pickedQty`
- **File**: `backend/src/modules/sales/sales.service.ts:649-725`
- **Issue**: Only `PickListLine.qtyPicked` is updated. The `allPicked` check on line 715 always evaluates to `false`, making the PICKING→PACKED transition dead code. Orders get stuck in PICKING.
- **Fix**: Update `SalesOrderLine.pickedQty` when processing pick lines.

---

## TIER 2: HIGH — Broken workflows or frontend-backend mismatches

### H-1. Customer statement endpoint missing (frontend calls it, backend doesn't have it)
- Frontend calls `GET /customers/:id/statement` and `GET /customers/:id/statement/pdf`
- Backend `CustomersController` has no such endpoints → **404 errors**

### H-2. Stock transfer missing GET endpoints (can create but can't list/view)
- `StockTransfersController` only has `POST /` and `POST /:id/confirm`
- No `GET /` (list) or `GET /:id` (detail) — transfers are write-only

### H-3. Stock transfer IN_TRANSIT status never used
- Schema has `IN_TRANSIT` enum value + `receivedQty` field
- Service goes directly DRAFT→COMPLETED, bypassing the 2-step flow

### H-4. Stock adjustment approval workflow never implemented
- Schema has `PENDING_APPROVAL`, `approvedBy`, `approvedAt`
- Service goes DRAFT→CONFIRMED directly, no threshold check, no approval

### H-5. Invoice creation doesn't update SO status to INVOICED
- `InvoicesService.createFromOrder()` creates invoice but never sets SO status to `INVOICED`

### H-6. Purchase Returns module entirely missing (SPECS.md §2.3.5)
- No `PurchaseReturn` model, no controller, no service, no frontend — the whole section is absent
- NOT listed as deferred in SPECS.md §6

### H-7. Settings profile/password forms are fake (console.log only)
- `handleProfileUpdate` and `handlePasswordUpdate` in settings page only `console.log` + show fake success
- Backend `PUT /users/me` and `POST /users/me/change-password` exist but are never called
- **Security concern**: Users think they changed their password but didn't

### H-8. Audit log data collected but completely inaccessible
- `AuditLogInterceptor` writes to `audit_logs` table on every mutation
- No `GET /audit-logs` endpoint exists, no frontend viewer — data is trapped

### H-9. Webhook support entirely missing (§4.7)
- Zero implementation — no registration, no event dispatch, no delivery tracking

### H-10. OAuth 2.0 entirely missing (§4.7)
- JWT-only auth; no OAuth provider, no client registration, no API keys

---

## TIER 3: MEDIUM — Feature gaps & inconsistencies

### Inventory & Items
| # | Finding | Spec Ref |
|---|---------|----------|
| M-1 | Item `brand` field missing entirely | §2.1.2 |
| M-2 | Item weight/dimensions saved but never returned in API response | §2.1.2 |
| M-3 | Bin location zone/aisle/rack/bin fields in schema but DTO ignores them | §2.2.3 |
| M-4 | Stock valuation uses simple cost×qty, not FIFO or Weighted Average | §2.2.1 |
| M-5 | Category: no custom attributes per category | §2.1.3 |
| M-6 | Category: no category-based pricing rules | §2.1.3 |
| M-7 | Warehouse-level permissions not implemented | §2.2.2 |
| M-8 | Stock count: no count sheet PDF generation | §2.2.8 |
| M-9 | Stock count: adjustment auto-confirmed with no approval step | §2.2.8 |
| M-10 | Stock count: cycle count by category/location partially broken | §2.2.8 |
| M-11 | Stock adjustment: missing GET /:id detail endpoint | §2.2.6 |
| M-12 | Stock adjustment: missing "Closing Adjustment" type | §2.2.6 |

### Sales
| # | Finding | Spec Ref |
|---|---------|----------|
| M-13 | `customerRef` (customer PO number) field unreachable via API | §2.4.3 |
| M-14 | Sales return `processRefund` is a stub (writes to notes field only) | §2.4.9 |
| M-15 | `PENDING_INSPECTION` status on returns never set (dead code) | §2.4.9 |
| M-16 | Customer balance always returns hardcoded `0` in list/detail | §2.4.1 |
| M-17 | Packing module entirely missing (pack slips, cartons, labels) | §2.4.5 |
| M-18 | Shipping charges not supported on sales orders | §2.4.3 |
| M-19 | Batch/wave picking not implemented | §2.4.4 |
| M-20 | Payment receipt PDF generation missing | §2.4.8 |
| M-21 | Salesperson assignment on customer missing | §2.4.1 |

### Purchases
| # | Finding | Spec Ref |
|---|---------|----------|
| M-22 | PO line discount shown on frontend but silently discarded | §2.3.2 |
| M-23 | Vendor address missing billing/shipping distinction | §2.3.1 |
| M-24 | Vendor balance always hardcoded to `0` | §2.3.1 |
| M-25 | Vendor transaction history missing PO and GRN data | §2.3.1 |
| M-26 | Vendor credit limit field missing | §2.3.1 |
| M-27 | Vendor performance metrics missing | §2.3.1 |
| M-28 | Cost variance tracking missing | §2.3.2 |
| M-29 | GRN quality inspection workflow missing | §2.3.3 |
| M-30 | Over-receiving blocked instead of configurable | §2.3.2 |

### Reports (backend exists, no frontend)
| # | Finding | Spec Ref |
|---|---------|----------|
| M-31 | Purchase reports: no frontend page (backend `GET /reports/purchase-summary` exists) | §2.6.3 |
| M-32 | Receivables/Payables reports: no frontend (backend endpoints exist) | §2.6.2/§2.6.3 |
| M-33 | Stock aging report missing entirely | §2.6.1 |
| M-34 | Reorder report (detailed, not just count) missing | §2.6.1 |
| M-35 | Sales by salesperson report missing | §2.6.2 |
| M-36 | Sales by category report missing | §2.6.2 |

### Users & Settings
| # | Finding | Spec Ref |
|---|---------|----------|
| M-37 | Custom role CRUD missing (can't create/edit/delete roles) | §2.7.1 |
| M-38 | Record-level restrictions (by warehouse) missing | §2.7.1 |
| M-39 | Document templates entirely missing | §2.8.2 |
| M-40 | Settings org form has phantom fields (defaultPaymentTerms etc.) not backed by schema | §2.8.1 |
| M-41 | Settings notification preferences toggle not wired to backend | §2.8.3 |
| M-42 | Organization `baseCurrency` not updatable via API | §2.8.1 |
| M-43 | Reports page summary export buttons have no onClick handler | §2.6 |

### Non-Functional
| # | Finding | Spec Ref |
|---|---------|----------|
| M-44 | Bahasa Malaysia language support entirely missing (no i18n) | §4.6 |
| M-45 | Background job processing missing (all ops synchronous) | §4.4 |
| M-46 | Login history not tracked (only lastLoginAt on user) | §2.6.4 |

---

## TIER 4: DEFERRED (acknowledged in SPECS.md §6.3/§6.4)

These are NOT bugs — they are explicitly deferred to future phases:

| Item | Deferred To |
|------|-------------|
| Quotation management | Phase 2 |
| Batch/lot tracking | Phase 2 |
| Serial number tracking | Phase 2 |
| Price lists & tiered pricing | Phase 2 |
| Backorder management | Phase 2 |
| Advanced reporting & analytics | Phase 2 |
| Automation rules | Phase 2 |
| E-invoicing (MyInvois) | Phase 2 |
| Multi-currency transactions | Phase 3 |
| Composite items / assemblies | Phase 3 |
| Vehicle compatibility database | Phase 3 |
| Advanced cross-reference system | Phase 3 |
| Accounting integration | Phase 3 |
| Marketplace integrations | Phase 3 |
| API for third-party access (OAuth) | Phase 3 |

---

## SPECS.md Inconsistency Found

**Batch Expiry Report** is listed as a Phase 1 report in §2.6.1, but **Batch Tracking** is deferred to Phase 2 in §6.3. A batch expiry report cannot exist without batch tracking. The spec should reconcile this.

---

## SPECS.md is Outdated

The spec's navigation structure (§8.2), API structure (§7), and MVP scope (§6) do not reflect the substantial additional features that have been built:
- 8+ new controller groups (GRNs, Shipments, Credit Notes, Vendor Credit Notes, Payments Made, Bulk Operations, Settings, Notifications)
- 30+ extra API endpoints beyond spec
- Extra sidebar items (Payments Received, Sales Returns, Bills, Goods Received, Stock by Bin, Stock Counts, Users)

**Recommendation**: Update SPECS.md sections 6, 7, and 8 to reflect current reality.
