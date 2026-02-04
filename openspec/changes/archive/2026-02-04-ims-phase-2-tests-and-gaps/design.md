## Context

The IMS backend has 7 test suites with 123 passing tests, covering auth, items, sales, bills, reports, sales-returns, and purchases services. However, several core services lack unit tests (customers, vendors, warehouses, invoicing, stock management). There is no E2E testing infrastructure. The web frontend has workflow gaps in stock counts, bill payments, and report exports.

Current state:
- Backend: NestJS with Prisma ORM, Jest for unit testing
- Web: Next.js 14 with React Query, Ant Design components
- Database: PostgreSQL with Prisma migrations

## Goals / Non-Goals

**Goals:**
- Complete unit test coverage for all backend services
- Establish E2E testing infrastructure with test database
- Fill critical web workflow gaps (stock count entry, bill payments, report exports)
- Enable CI/CD test automation

**Non-Goals:**
- Mobile app testing (separate effort)
- Performance/load testing infrastructure
- 100% code coverage (focus on critical paths)
- UI component testing (E2E covers user workflows)

## Decisions

### 1. E2E Testing Framework
**Decision:** Use Jest + Supertest for E2E tests, matching existing unit test setup.
**Rationale:** Consistent tooling, no new dependencies to learn, good NestJS integration.
**Alternative considered:** Playwright for full-stack E2E - rejected as overkill for API testing.

### 2. Test Database Strategy
**Decision:** Use separate test database with automatic reset between test suites.
**Rationale:** Isolation prevents test pollution, Prisma migrations make setup easy.
**Implementation:** `DATABASE_URL_TEST` env var, `prisma migrate reset` in test setup.

### 3. Unit Test Pattern
**Decision:** Follow existing pattern - mock PrismaService, test service methods in isolation.
**Rationale:** Established pattern works well (see purchases.service.spec.ts), fast execution.

### 4. Report Export Approach
**Decision:** Use existing PDF service patterns, add xlsx package for Excel exports.
**Rationale:** PDFKit already in use, xlsx is battle-tested for Excel generation.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Test database setup complexity | Use Docker Compose for local test DB; CI uses separate test DB |
| E2E tests slow CI pipeline | Run unit tests first, E2E only on main branch |
| Mock drift from real database | E2E tests validate actual database behavior |
| Excel export memory usage | Stream large exports, limit report date ranges |
