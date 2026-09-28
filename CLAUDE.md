# CLAUDE.md — CampusIQ

Guidance for Claude Code when working in this repo. Read this fully before acting.

---

## Current stage

> **STAGE: 1 — complete (awaiting review).** Update this line as you go (e.g. "STAGE 3 — in progress").
> Only work on the current stage. Do not start the next stage until I say so.

---

## What this is

CampusIQ is a full-stack campus information assistant, built as a portfolio/interview
demo. Students browse a course catalog and ask an AI assistant two kinds of question:

- **Knowledge questions** (policies, FAQs) → answered from a document set by retrieval
  (RAG over pgvector), with source citations.
- **Personal questions** ("what am I enrolled in") → answered by an agent that calls an
  authenticated backend endpoint (a "Provider"), so user data stays behind the service
  that owns it.

It exists to demonstrate specific skills for a job, not to become a product. The value is
in clean, defensible decisions — not features.

## Golden rules (read every session)

1. **Work one stage at a time.** Each stage below has a Definition of Done and a STOP.
   At a STOP, summarise what changed and wait for me. Do not roll into the next stage.
2. **Thin, not gold-plated.** Build the least that satisfies the stage. No extra entities,
   no styling polish, no features a stage does not ask for. If tempted to add something,
   list it under "Deferred" in the decision log instead.
3. **Explain decisions, briefly.** When you make a design choice (auth, data model,
   retrieval), add a 2–3 line entry to `docs/DECISIONS.md`: what, why, what you deferred.
   This file is the real deliverable — I get asked to defend it in interviews.
4. **Secrets live in the environment**, never in code or git. Use a `.env` file (gitignored)
   and read via config. Provide a `.env.example` with keys and dummy values.
5. **Ask before anything destructive or ambiguous** — deleting data, changing a public API
   shape already built, adding a dependency not listed here.
6. **Small commits, conventional messages.** One logical change per commit.
   Format: `type(scope): summary` (e.g. `feat(catalog): add Course model`).

## Tech stack (do not substitute without asking)

| Layer     | Choice                                             |
|-----------|----------------------------------------------------|
| Backend   | Python 3.12, Django 5, Django REST Framework       |
| Auth      | djangorestframework-simplejwt (stateless JWT)      |
| Database  | PostgreSQL 16 + pgvector extension                 |
| AI        | Google Gemini via the `google-genai` SDK (embeddings + generation) |
| Frontend  | Angular (latest) + TypeScript                      |
| Tests     | pytest + pytest-django + DRF APIClient             |
| CI        | GitHub Actions                                     |
| Deploy    | Docker; single host (Fly.io or Render)             |

## Repo layout

```
backend/          Django project (config/) + apps (catalog/, assistant/, accounts/)
frontend/         Angular app
docs/
  DECISIONS.md    decision log — keep current
  data/           sample FAQ/policy documents for RAG ingestion
.env.example
docker-compose.yml
.github/workflows/ci.yml
```

## Commands (note where each runs)

**Backend — run in `backend/`, virtualenv active:**
```bash
python -m venv venv && source venv/bin/activate   # first time only
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver                        # http://localhost:8000
pytest                                            # run tests
```

**Database — run in `psql` against the dev DB, once:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Frontend — run in `frontend/`:**
```bash
npm install
ng serve                                          # http://localhost:4200
```

**Docker — run in repo root:**
```bash
docker compose up --build
```

## Conventions

- **Python:** type hints on function signatures; `ruff` clean; no logic in views that
  belongs in a service function; serializers do validation, not business rules.
- **DRF:** ViewSets + routers for CRUD; explicit permission classes on every view
  (`IsAuthenticated` by default). No endpoint ships without an auth decision.
- **Django ORM:** watch for N+1 — use `select_related` / `prefetch_related` on list
  endpoints. Migrations are generated (`makemigrations`), never hand-edited.
- **Angular:** typed models for API responses; API calls in services, not components;
  an HTTP interceptor attaches the JWT. Plain styling is fine.
- **AI code:** the model is an unreliable component — validate its output, cap tokens,
  and give the agent loop an iteration limit so it always terminates.
- **Tests:** every stage from 3 on adds at least one real test. Don't test framework code;
  test the behaviour that would embarrass me if it broke.

---

## Build stages

Each stage is a clean stopping point. Definition of Done ("DoD") must pass before STOP.

### Stage 1 — Django + DRF core
**Goal:** an authenticated REST API over a small relational model.
- Scaffold `backend/` with `config` project and a `catalog` app.
- Models: `Category` and `Course` with a ForeignKey (`Course.category`).
- ModelSerializers, a ModelViewSet per model, a DefaultRouter under `/api/`.
- SimpleJWT: token obtain/refresh endpoints; all catalog endpoints require auth.
- Fix the N+1 on the course list with `select_related('category')`.
- `requirements.txt`, `.env.example`, `.gitignore`, initial migration.

**DoD:** can create a superuser, get a JWT, and list/read courses authenticated; the list
view issues one query for categories, not one per row. **→ STOP.**

### Stage 2 — Angular shell
**Goal:** a real, thin frontend wired to the API.
- `frontend/` Angular app; typed `Course`/`Category` models.
- Login screen that obtains a JWT; HTTP interceptor attaches it to API calls.
- Catalog list view and a detail view, calling the DRF API.
- No styling beyond legible/plain.

**DoD:** log in from the UI, see the catalog loaded from the backend with the token
attached to requests. **→ STOP.**

### Stage 3 — Knowledge layer (RAG on Gemini)
**Goal:** grounded, cited answers from a document set.
- `assistant` app. Enable pgvector; a `DocumentChunk` model with a `VectorField`.
- Ingestion command: read `docs/data/`, chunk (256–512 tokens, ~10–15% overlap),
  embed each chunk with Gemini, store vectors.
- `/api/assistant/ask` endpoint: embed the question, cosine top-k retrieval, pass chunks +
  question to Gemini with an instruction to answer only from context and cite sources.
- Return the answer plus the source list.
- Test: a known question returns an answer citing the right source.

**DoD:** ask a policy question via the API and get a grounded answer with citations.
**→ STOP.**

### Stage 4 — Provider agent (the differentiator)
**Goal:** an agent that fetches the signed-in user's own data through a tool.
- An `Enrollment` model linking a user to courses; seed a couple of rows.
- An authenticated endpoint returning the current user's enrollments.
- Agent loop using Gemini function calling with one tool ("Provider") that calls that
  endpoint with the user's token. Iteration limit; tool errors handled without crashing.
- Routing: knowledge questions → RAG (Stage 3); personal questions → the Provider.
- Test: "what am I enrolled in" triggers the tool and returns the user's real courses.

**DoD:** the assistant answers both a knowledge question and a personal question, using
the right path for each. **→ STOP.**

### Stage 5 — Quality & operation
**Goal:** show you operate what you build.
- pytest suite: auth-required, N+1-stays-fixed, retrieval-returns-citations,
  provider-returns-user-data.
- GitHub Actions workflow: install, run tests on every push.
- Dockerfile(s) + `docker-compose.yml` (app + Postgres); one deploy to a real URL.
- Structured logging with a request ID; a `/health` endpoint.
- Finalise `README.md` (problem, architecture, decisions, how to run) and `docs/DECISIONS.md`.

**DoD:** tests pass in CI; the app runs from `docker compose up`; README and decision log
are complete. **→ STOP.**

---

## Out of scope (do not build unless I ask)

Multi-tenancy, real university integrations, payment, notifications, admin dashboards,
role systems beyond a basic user, styling systems, more than the two AI paths above.
