# Decision log

Short entries: what, why, what was deferred. Newest stage last.

## Stage 1 — Django + DRF core

**Auth: stateless JWT (SimpleJWT), authenticated-by-default.**
JWT and `IsAuthenticated` are the global DRF defaults, and each view also declares its
permission class explicitly, so no endpoint can ship open by accident. Stateless tokens
suit an Angular SPA and let the Stage 4 agent forward the user's own token to the Provider.
Short access token (15 min) plus a 1-day refresh token, both configurable via env.
*Deferred:* token blacklisting/rotation on logout, roles beyond "signed-in user".

**Data model: `Category` 1—N `Course`, `on_delete=PROTECT`.**
Deleting a category that still has courses is refused rather than cascading, because silently
wiping a catalog is worse than an error. `Course.code` is unique (the natural key students use).
The API maps that refusal to `409 Conflict` with a message (found in local testing: it was a 500).
*Deferred:* prerequisites, terms/sections, instructors.

**N+1: `select_related("category")` on the course queryset.**
The serializer exposes `category_name` so the frontend needs no second request, which is
exactly what would cause an N+1. The fix is a single JOIN. A test asserts the list endpoint's
query count stays constant as rows grow (verified to fail with the fix removed: 15 vs 5 queries).

**Pagination: page-number, 20 per page, global default.**
Bounded response size from day one; changing a list endpoint's shape later would break clients.

**Config: `django-environ`, one `DATABASE_URL`, `.env` at repo root.**
Typed env parsing, and one DB URL instead of five settings. The root `.env` is shared with
docker compose so the DB credentials are defined once. No secrets in code; `.env.example` has dummies.

**Dev environment: Python 3.12 via `uv`, Postgres via a db-only `docker-compose.yml`.**
The host only had Python 3.10; `uv` provides 3.12 without touching the system Python. The
compose file uses the `pgvector/pgvector:pg16` image now so Stage 3 needs no DB change;
the app service is added in Stage 5.

**Tooling: ruff with migrations excluded and RUF012 ignored.**
Migrations are generated code; RUF012 flags Django's idiomatic `Meta.fields`/`permission_classes` lists.

*Deferred (Stage 1):* filtering/search on the course list, API schema/docs (drf-spectacular),
CORS (needed in Stage 2 when Angular calls the API).
