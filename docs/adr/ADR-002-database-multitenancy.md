# ADR-002: Database & Multi-Tenancy Strategy — PostgreSQL Shared Schema + RLS

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2024-01-01 |
| **Deciders** | Andrés Zamudio |

---

## Context

Zolution is a multi-tenant SaaS platform. Each tenant is a business (dental clinic, barbershop, etc.) with its own data — conversations, appointments, agent configuration, users. The architecture must guarantee strict data isolation between tenants while remaining operationally manageable as the number of tenants grows to hundreds or thousands.

Three classic multi-tenancy models were evaluated:

| Model | Description |
|---|---|
| **Separate databases** | One DB instance per tenant |
| **Schema-per-tenant** | One PostgreSQL schema per tenant, shared DB instance |
| **Shared schema + tenant_id** | All tenants in one schema; every table has an `organization_id` column |

## Decision

**Use PostgreSQL 16 with a shared schema and Row-Level Security (RLS).**

Every table that contains tenant-owned data has an `organization_id` column. PostgreSQL RLS policies enforce that each database session can only see and modify rows matching its `organization_id`. This isolation is enforced at the database engine level — not just at the application layer.

**Superadmin access:** The superadmin operates via a separate service connection that explicitly bypasses RLS (`SET LOCAL row_security = off`). This bypass is only available server-side through the admin service layer; no JWT issued to a frontend client can trigger it. All superadmin data access is logged to `audit_log`.

## Considered Alternatives

| Option | Reason not chosen |
|---|---|
| Separate databases | Operationally expensive at scale (hundreds of DB instances to manage, back up, migrate); connection pooling becomes complex |
| Schema-per-tenant | Each new tenant requires DDL (`CREATE SCHEMA`, apply migrations); migration tooling complexity grows linearly with tenant count; at 1,000+ tenants becomes unmanageable with Alembic |
| Shared schema + app-level filtering | Simpler to implement but isolation is only as strong as the application code — a bug in query filters leaks data across tenants |

## Consequences

- **Positive:** A single Alembic migration applies to all tenants simultaneously — no per-tenant migration runs.
- **Positive:** RLS isolates data at the DB engine level — a bug in application query logic cannot leak cross-tenant data.
- **Positive:** Operationally simple: one database to back up, monitor, and upgrade.
- **Positive:** Scales to thousands of tenants without infrastructure changes.
- **Negative:** All tenants share the same database performance envelope — a high-traffic tenant can affect others (mitigated with connection pooling via PgBouncer, which is planned for Phase 4).
- **Negative:** Requires developers to be mindful of RLS policy setup when adding new tables (documented in contributing guidelines).

## RLS Implementation Pattern

```sql
-- Example: conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON conversations
    USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

The FastAPI middleware sets `app.current_organization_id` at the start of each request, derived from the verified Auth0 JWT.

## References

- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-tenancy Patterns (Citus Data)](https://www.citusdata.com/blog/2016/10/03/designing-your-saas-database-for-high-scalability/)
