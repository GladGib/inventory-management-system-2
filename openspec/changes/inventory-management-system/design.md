## Context

This is a greenfield Inventory Management System (IMS) targeting Malaysian SMEs in auto parts, hardware, and spare parts wholesale. The system requires three applications: a NestJS backend API, a Next.js web application, and a Flutter mobile app for warehouse operations.

**Current State:** No existing codebase. Starting from scratch with the tech stack defined in the proposal.

**Constraints:**
- Must support Malaysian GST/SST tax compliance
- Mobile app requires offline-first capability for warehouse operations
- B2B focus: credit terms, bulk pricing, multi-warehouse support
- High SKU count (100,000+ items) with barcode-centric workflows

**Stakeholders:**
- Auto parts wholesalers (primary users)
- Hardware store owners
- Warehouse staff (mobile app users)

## Goals / Non-Goals

**Goals:**
- Establish a scalable monorepo structure for all three applications
- Design a clean, modular backend architecture using NestJS best practices
- Implement multi-tenant data isolation at the organization level
- Create a consistent API design pattern across all endpoints
- Enable offline-first mobile operations with conflict resolution
- Support future extensibility (Phase 2/3 features)

**Non-Goals:**
- Real-time collaboration (not needed for MVP)
- Multi-currency transactions (deferred to Phase 3)
- Marketplace integrations (deferred to Phase 3)
- Advanced analytics/BI dashboards (deferred to Phase 2)
- E-invoicing/MyInvois integration (deferred to Phase 2)

## Decisions

### 1. Monorepo Structure

**Decision:** Use a monorepo with separate `/backend`, `/web`, and `/mobile` directories.

**Rationale:**
- Simpler dependency management for shared types
- Easier CI/CD configuration
- Better code visibility across teams

**Alternatives Considered:**
- Separate repositories: Rejected due to overhead of managing shared types and API contracts
- Nx/Turborepo monorepo: Considered, but adds complexity for a small team. Can migrate later if needed.

### 2. Backend Architecture (NestJS)

**Decision:** Feature-based module structure with shared common module.

```
/backend/src
├── /modules
│   ├── /auth          # Authentication & authorization
│   ├── /organizations # Org settings, tax config
│   ├── /users         # User management, roles
│   ├── /items         # Items, categories, variants
│   ├── /customers     # Customer management
│   ├── /vendors       # Vendor management
│   ├── /warehouses    # Warehouse, bins, stock levels
│   ├── /sales         # Sales orders, invoices, payments
│   ├── /purchases     # POs, GRN, bills
│   ├── /inventory     # Adjustments, transfers, counts
│   └── /reports       # Report generation
├── /common
│   ├── /decorators    # Custom decorators (CurrentUser, etc.)
│   ├── /guards        # Auth guards, role guards
│   ├── /filters       # Exception filters
│   ├── /interceptors  # Logging, transform interceptors
│   ├── /pipes         # Validation pipes
│   └── /utils         # Shared utilities
├── /prisma
│   ├── schema.prisma  # Database schema
│   └── /migrations    # Migration files
└── /config            # Environment configuration
```

**Rationale:**
- NestJS modules provide natural boundaries
- Each module owns its controllers, services, DTOs
- Prisma service shared via dependency injection

**Alternatives Considered:**
- Clean/Hexagonal architecture: Too much boilerplate for MVP scope
- CQRS pattern: Overkill for current scale, can adopt later for complex queries

### 3. Database Design

**Decision:** PostgreSQL with Prisma ORM, single database with organization_id tenant isolation.

**Key Design Patterns:**
- All tenant-scoped tables include `organization_id` column
- Soft deletes via `deleted_at` timestamp (nullable)
- Audit fields: `created_at`, `updated_at`, `created_by`, `updated_by`
- Document numbers use sequences per organization

**Core Schema Groups:**

```
Organization & Users:
- organizations (tenant root)
- users (belongs to organization)
- roles (predefined + custom)
- permissions (granular access control)

Master Data:
- items (with type: simple, variant_parent, bundle)
- item_variants (for variant items)
- categories (self-referential for hierarchy)
- customers
- customer_addresses
- vendors
- vendor_addresses
- warehouses
- bin_locations
- tax_rates

Transactions:
- sales_orders → sales_order_lines
- invoices → invoice_lines
- payments_received → payment_allocations
- sales_returns → sales_return_lines
- purchase_orders → purchase_order_lines
- goods_received_notes → grn_lines
- purchase_bills → bill_lines
- payments_made → payment_allocations

Inventory:
- stock_levels (item + warehouse + bin → quantity)
- stock_movements (ledger of all in/out)
- stock_adjustments → adjustment_lines
- stock_counts → count_lines
```

**Rationale:**
- PostgreSQL: Robust, supports complex queries, good JSON support
- Prisma: Type-safe, great DX, auto-generated types
- Single DB with tenant column: Simpler than DB-per-tenant for MVP scale

**Alternatives Considered:**
- MongoDB: Rejected; relational data with strong consistency needed
- TypeORM: Prisma has better type safety and migration tooling
- DB-per-tenant: Operational overhead not justified for MVP

### 4. Authentication & Authorization

**Decision:** JWT with refresh tokens, RBAC with predefined roles.

**Implementation:**
- Access token: 15-minute expiry, stored in memory (web) / secure storage (mobile)
- Refresh token: 7-day expiry, stored in httpOnly cookie (web) / secure storage (mobile)
- Roles: Admin, Manager, Sales, Purchasing, Warehouse, Accountant, Viewer
- Permissions: Granular, checked via guards

**Token Payload:**
```typescript
{
  sub: string,           // user ID
  org: string,           // organization ID
  role: string,          // role name
  permissions: string[], // permission codes
  iat: number,
  exp: number
}
```

**Rationale:**
- JWT: Stateless, works well with API-first architecture
- Refresh tokens: Better security than long-lived access tokens
- Predefined roles: Covers 90% of use cases, custom roles in Phase 2

**Alternatives Considered:**
- Session-based auth: Doesn't scale well for mobile/API-first
- OAuth2/OIDC: Overkill for B2B internal users, can add later for SSO

### 5. API Design

**Decision:** RESTful API with OpenAPI 3.0 specification, consistent patterns.

**URL Patterns:**
```
GET    /api/v1/{resource}          # List with pagination, filters
GET    /api/v1/{resource}/:id      # Get single resource
POST   /api/v1/{resource}          # Create resource
PUT    /api/v1/{resource}/:id      # Update resource
DELETE /api/v1/{resource}/:id      # Soft delete resource
POST   /api/v1/{resource}/:id/{action}  # State transitions
```

**Standard Response Format:**
```typescript
// Success (single)
{ data: T }

// Success (list)
{ data: T[], meta: { total, page, limit } }

// Error
{ error: { code: string, message: string, details?: any } }
```

**Pagination:** Offset-based with `page` and `limit` query params (default: page=1, limit=20, max=100)

**Filtering:** Query params with operators: `?status=draft&created_at[gte]=2024-01-01`

**Rationale:**
- REST: Well-understood, good tooling, fits CRUD-heavy operations
- OpenAPI: Auto-generates client types, documentation
- Consistent patterns: Reduces cognitive load

**Alternatives Considered:**
- GraphQL: More flexible but adds complexity; REST sufficient for MVP
- tRPC: Great DX but less suited for Flutter client

### 6. Web Frontend Architecture

**Decision:** Next.js 14+ App Router with TanStack Query and Ant Design.

**Structure:**
```
/web/src
├── /app
│   ├── /(auth)           # Login, forgot password
│   ├── /(dashboard)      # Main authenticated layout
│   │   ├── /dashboard
│   │   ├── /items
│   │   ├── /sales
│   │   ├── /purchases
│   │   ├── /inventory
│   │   ├── /reports
│   │   └── /settings
│   └── layout.tsx
├── /components
│   ├── /ui              # Wrapped Ant Design components
│   ├── /forms           # Form components with validation
│   ├── /tables          # Data table components
│   └── /layout          # Sidebar, header, etc.
├── /hooks
│   ├── /queries         # TanStack Query hooks per module
│   └── /mutations       # Mutation hooks
├── /lib
│   ├── api-client.ts    # Axios instance with interceptors
│   ├── auth.ts          # Auth utilities
│   └── utils.ts
├── /types               # Shared TypeScript types
└── /stores              # Zustand stores for UI state
```

**State Management:**
- Server state: TanStack Query (caching, sync, mutations)
- UI state: Zustand (minimal, for modals, sidebars, etc.)
- Form state: React Hook Form with Zod validation

**Rationale:**
- Next.js App Router: Modern, good SSR/SSG support, API routes
- TanStack Query: Excellent caching, background refetch, mutation handling
- Ant Design: Comprehensive component library, good for B2B dashboards
- Zustand: Lightweight, simple API for minimal UI state

**Alternatives Considered:**
- Pages Router: App Router is the future, better for new projects
- Redux: Overkill when TanStack Query handles server state
- Material UI: Ant Design has better table/form components for B2B

### 7. Mobile Architecture (Flutter)

**Decision:** Feature-first architecture with offline-first data layer.

**Structure:**
```
/mobile/lib
├── /core
│   ├── /api             # API client, interceptors
│   ├── /database        # SQLite/Isar local DB
│   ├── /sync            # Sync engine, conflict resolution
│   ├── /auth            # Auth state, token management
│   └── /utils           # Shared utilities
├── /features
│   ├── /auth            # Login screen
│   ├── /picking         # Pick list processing
│   ├── /receiving       # Goods receiving
│   ├── /stock_lookup    # Item/stock search
│   └── /stock_count     # Inventory counting
├── /shared
│   ├── /widgets         # Reusable UI components
│   └── /models          # Shared data models
└── main.dart
```

**Offline Strategy:**
- Local SQLite database for offline data (items, stock levels, pending operations)
- Operation queue for offline mutations
- Background sync when connectivity restored
- Last-write-wins conflict resolution (with timestamp)

**Barcode Scanning:**
- Use `mobile_scanner` package for camera-based scanning
- Support EAN-13, Code 128, QR codes

**Rationale:**
- Feature-first: Clear boundaries, easier testing
- SQLite: Mature, well-supported for offline storage
- Operation queue: Reliable offline mutation handling

**Alternatives Considered:**
- BLoC: Good but verbose; Provider + Riverpod simpler for this scope
- Hive: SQLite better for relational queries needed here

### 8. Number Sequence Generation

**Decision:** Per-organization sequences with configurable prefixes.

**Format:** `{PREFIX}-{YYYYMM}-{SEQUENCE}`
- Example: `SO-202601-00001`, `INV-202601-00001`

**Implementation:**
- `number_sequences` table: tracks last number per org, document type, period
- Atomic increment using database transaction
- Reset sequence monthly (configurable)

**Rationale:**
- Meaningful prefixes aid identification
- Monthly reset keeps numbers shorter
- Per-org isolation prevents conflicts

### 9. File Storage

**Decision:** Local filesystem for MVP, abstracted for cloud migration.

**Implementation:**
- Store files in `/uploads/{org_id}/{type}/{date}/{filename}`
- Abstract via FileStorageService interface
- Can swap to S3/GCS later without code changes

**File Types:**
- Item images
- Document attachments (POs, invoices)
- Report exports (PDF, Excel)

**Rationale:**
- Simpler for MVP deployment
- Abstraction allows easy cloud migration

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Single database bottleneck at scale | Performance degradation with high data volume | Add read replicas, optimize indexes, consider sharding later |
| Offline sync conflicts | Data inconsistency | Last-write-wins with timestamp; admin conflict dashboard in Phase 2 |
| Mobile app size | Large download for feature-rich app | Lazy load features, optimize assets, consider app bundles |
| Prisma cold start | Slower initial API response | Keep connection pool warm, use connection pooling |
| JWT token theft | Unauthorized access | Short expiry, refresh rotation, secure storage |
| Barcode scanning accuracy | Incorrect items picked | Visual confirmation UI, item image display |

## Migration Plan

**Not applicable** - This is a greenfield project with no existing data to migrate.

**Deployment Strategy:**
1. Set up PostgreSQL database
2. Deploy backend API (Docker container)
3. Deploy web application (Vercel or static hosting)
4. Publish mobile apps (TestFlight/Play Store beta first)
5. Onboard pilot customers with data import tools

**Rollback Strategy:**
- Database: Point-in-time recovery enabled
- Backend: Blue-green deployment, instant rollback to previous version
- Web: Vercel instant rollback
- Mobile: Staged rollout, force update if critical

## Open Questions

1. **Hosting environment:** AWS, GCP, or DigitalOcean? (Affects deployment scripts)
2. **Email service:** SendGrid, AWS SES, or other? (For PO emails, notifications)
3. **PDF generation:** Server-side (Puppeteer) or client-side (react-pdf)?
4. **Backup strategy:** Frequency, retention period, offsite storage location?
5. **Mobile app distribution:** Public stores or enterprise MDM for initial rollout?
