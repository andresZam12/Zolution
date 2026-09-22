# ADR-003: Authentication — Auth0 with Organizations (MVP)

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2024-01-01 |
| **Deciders** | Andrés Zamudio |
| **Review Date** | Revisit when MAU billing becomes a significant cost line |

---

## Context

Zolution requires authentication and authorization for two distinct user types:

1. **Business owners and their staff** — belong to a specific tenant organization; can only see and act on their own data.
2. **Superadmin** — platform operator; can view all tenants and impersonate any business for debugging.

The system is multi-tenant B2B from day one. Auth must support:
- Per-tenant user management (each business manages its own staff)
- JWT issuance for API calls (consumed by FastAPI backend)
- Integration with Angular SPA (frontend)
- A clear separation between tenant users and the superadmin

## Decision

**Use Auth0 with the Organizations feature for the MVP phase.**

Auth0 Organizations maps directly to Zolution's model: each business = one Auth0 Organization. Users belong to organizations and receive JWTs scoped to their organization. The `organization_id` from the Auth0 JWT feeds directly into the RLS policy middleware (see ADR-002).

The Angular frontend will use the official `@auth0/auth0-angular` SDK. The FastAPI backend will validate JWTs using Auth0's JWKS endpoint.

**Superadmin users** are Auth0 users with `role: superadmin` in the JWT claims (via Auth0 Actions/Rules) and `organization_id = null`. They access separate `/admin/*` routes backed by a service-level database connection that bypasses RLS.

## Considered Alternatives

| Option | Reason not chosen for MVP |
|---|---|
| **Keycloak (self-hosted)** | Better long-term cost and control, but adds significant DevOps complexity (running, maintaining a Keycloak instance) during MVP validation phase |
| **Supabase Auth** | Tightly coupled to Supabase's own database layer; conflicts with our PostgreSQL + Alembic + RLS stack |
| **Clerk** | Good DX but less mature Organizations feature for multi-tenant B2B; pricing model less predictable at scale |
| **Custom JWT (DIY)** | Maximum control but builds security-critical infrastructure from scratch — not acceptable for an MVP |

## Migration Path

The authentication layer is isolated behind `backend/app/auth/`. The public interface is:

```python
# backend/app/auth/dependencies.py
async def get_current_user(token: str) -> UserContext:
    """Returns a UserContext regardless of the underlying auth provider."""
    ...
```

All application code depends on `UserContext`, never on Auth0-specific types. If Keycloak or another provider is adopted later, only `backend/app/auth/` needs to change.

## Consequences

- **Positive:** Fast integration via official SDKs (`@auth0/auth0-angular`, `python-jose`).
- **Positive:** Organizations feature directly models the multi-tenant structure.
- **Positive:** Managed service — no infrastructure to operate for auth.
- **Negative:** Auth0 billing scales with Monthly Active Users (MAU); at high tenant counts this could become a significant cost. The migration path above mitigates lock-in.
- **Negative:** Data residency of authentication tokens is managed by Auth0 (relevant for businesses handling patient data — addressed by ensuring no PHI flows through Auth0).

## References

- [Auth0 Organizations](https://auth0.com/docs/manage-users/organizations)
- [auth0-angular SDK](https://github.com/auth0/auth0-angular)
- [FastAPI + Auth0 JWT validation](https://auth0.com/blog/build-and-secure-fastapi-server-with-auth0/)
