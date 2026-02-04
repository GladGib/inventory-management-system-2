## 1. Backend: Email Service Infrastructure

- [x] 1.1 Create email service with Nodemailer and configurable SMTP transport
- [x] 1.2 Create email templates for PO and invoice sending (Handlebars)
- [x] 1.3 Add email configuration to environment variables

## 2. Backend: Shipment Module

- [x] 2.1 Create shipment entity and DTOs *(already existed)*
- [x] 2.2 Implement shipment creation endpoint (POST /sales-orders/:id/shipments) *(already existed)*
- [x] 2.3 Implement shipment status update endpoints (dispatch, deliver) *(already existed)*
- [x] 2.4 Add delivery order PDF generation to pdf.service.ts *(already existed)*

## 3. Backend: Credit Notes Module

- [x] 3.1 Create credit note entity and DTOs *(already existed)*
- [x] 3.2 Implement sales credit note generation from returns *(already existed)*
- [x] 3.3 Implement credit note application to invoices *(already existed)*
- [x] 3.4 Add credit note PDF generation to pdf.service.ts *(already existed)*
- [x] 3.5 Implement vendor credit notes handling *(already existed)*

## 4. Backend: Goods Receiving Extensions

- [x] 4.1 Implement direct GRN creation endpoint (without PO)
- [x] 4.2 Add bin assignment support to GRN creation

## 5. Backend: Invoice & Payment Extensions

- [x] 5.1 Add payment receipt PDF generation to pdf.service.ts
- [x] 5.2 Implement PO email sending endpoint
- [x] 5.3 Implement invoice email sending endpoint

## 6. Backend: Unit Tests

- [x] 6.1 Write unit tests for goods receiving service *(purchases.service.spec.ts already existed)*
- [x] 6.2 Write unit tests for user service
- [x] 6.3 Write unit tests for organization service

## 7. Backend: E2E Tests

- [x] 7.1 Write E2E tests for auth endpoints
- [x] 7.2 Write E2E tests for user endpoints
- [x] 7.3 Write E2E tests for items endpoints
- [x] 7.4 Write E2E tests for sales order workflow

## 8. Web: Goods Receiving Workflow

- [x] 8.1 Create GRN creation form page with PO selection
- [x] 8.2 Implement quantity entry with validation against PO
- [x] 8.3 Add bin assignment dropdown/selector to receiving form
- [x] 8.4 Implement direct GRN creation (without PO) form variant
- [x] 8.5 Add GRN print/download button to detail page

## 9. Web: Purchase Bills Workflow

- [x] 9.1 Create bill creation page with GRN selection
- [x] 9.2 Implement payment recording modal component
- [x] 9.3 Create payments made list page

## 10. Web: Sales Returns Workflow

- [x] 10.1 Add "Create Return" button to invoice detail page
- [x] 10.2 Create return creation form pre-populated from invoice
- [x] 10.3 Implement return inspection workflow UI
- [x] 10.4 Add credit note view/print to return detail page

## 11. Web: Stock Count Workflow

- [x] 11.1 Create stock count creation wizard (warehouse, scope selection)
- [x] 11.2 Implement stock count entry form
- [x] 11.3 Create variance review page
- [x] 11.4 Add adjustment approval UI to adjustments page

## 12. Web: Shipments & Sales Orders

- [x] 12.1 Create shipment creation modal component
- [x] 12.2 Integrate shipment modal into sales order detail page
- [x] 12.3 Add shipment history list to sales order detail
- [x] 12.4 Add order PDF preview/print buttons to order detail page

## 13. Web: Invoicing Features

- [x] 13.1 Add "Send Email" button to invoice detail page
- [x] 13.2 Create payments received list page

## 14. Web: Vendor Features

- [x] 14.1 Create vendor details page with transaction history
- [x] 14.2 Implement vendor-item linking UI (add/edit vendor items)
- [x] 14.3 Add "Send Email" button to PO detail page

## 15. Web: Customer Features

- [x] 15.1 Create customer details page with transaction history
- [x] 15.2 Implement customer addresses management UI
- [x] 15.3 Create customer statement view with date range filter
- [x] 15.4 Add statement print/PDF download

## 16. Web: Warehouse Features

- [x] 16.1 Create bin locations management page
- [x] 16.2 Implement create/edit bin modal
- [x] 16.3 Create stock by bin view page

## 17. Web: Report Exports

- [x] 17.1 Add PDF/Excel export buttons to stock valuation report
- [x] 17.2 Add PDF/Excel export buttons to sales by customer report
- [x] 17.3 Create reusable report export button component

---

## Summary

| Group | Tasks | Description | Status |
|-------|-------|-------------|--------|
| 1-5 | 14 | Backend features | ✅ Complete |
| 6-7 | 7 | Backend tests | ✅ Complete |
| 8-17 | 21 | Web frontend | ✅ Complete |
| **Total** | **42** | | **✅ All Complete** |
