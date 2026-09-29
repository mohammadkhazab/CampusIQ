# Stage 1 — Manual API Testing Guide

How to verify the Stage 1 Definition of Done by hand (curl or Postman), the problems hit
along the way, and a reference set of API requests.

**Stage 1 DoD:** create a superuser, get a JWT, list/read courses authenticated; the course
list issues one query for categories, not one per row.

---

## 1. Setup

Run in `backend/` with the virtualenv active:

```bash
source venv/bin/activate
python manage.py migrate
python manage.py createsuperuser        # or: python manage.py changepassword <user>
python manage.py runserver              # http://localhost:8000
```

Check you're in the venv: tracebacks mentioning `/usr/lib/python3.x` mean you're on the
system Python, not the project's.

---

## 2. How auth works

- `POST /api/token/` with username/password → returns **two** tokens:
  - **access** — sent on every API call as `Authorization: Bearer <access>`. Short-lived
    (`JWT_ACCESS_MINUTES` in `.env`).
  - **refresh** — used *only* at `/api/token/refresh/` to get a new access token.
    Longer-lived (`JWT_REFRESH_DAYS`). Rotation is off, so the same refresh token keeps
    working until it expires.
- All catalog endpoints require a valid access token (`IsAuthenticated`). Only JWT auth is
  enabled — being logged into `/admin/` does **not** authenticate API requests.
- To inspect a token's claims (`user_id`, `exp`):
  ```bash
  echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null; echo
  ```

---

## 3. Testing with curl

```bash
# Get an access token into a variable
TOKEN=$(curl -s -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USER","password":"YOUR_PASS"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access'])")

echo "$TOKEN"                       # should print a long eyJ... string

# Authenticated → 200
curl -i http://localhost:8000/api/courses/ -H "Authorization: Bearer $TOKEN"

# Unauthenticated → 401
curl -i http://localhost:8000/api/courses/
```

If `$TOKEN` is empty, run the token request on its own (without `TOKEN=$(...)`) to see the
server's actual reply.

---

## 4. Testing with Postman

**Collection:** `CampusIQ API Collection` with three requests: *Authenticate*, *Get Courses*,
*Refresh Token*.

**Variables (collection scope, type *secret*):**

| Variable        | Holds                          |
|-----------------|--------------------------------|
| `access_token`  | the `access` value from login  |
| `refresh_token` | the `refresh` value from login |

**Requests:**

| Request       | Method | URL                                         | Auth                          | Body (raw → JSON)                    |
|---------------|--------|---------------------------------------------|-------------------------------|--------------------------------------|
| Authenticate  | POST   | `http://localhost:8000/api/token/`          | No Auth                       | `{"username": "...", "password": "..."}` |
| Get Courses   | GET    | `http://localhost:8000/api/courses/`        | Bearer Token `{{access_token}}` | —                                  |
| Refresh Token | POST   | `http://localhost:8000/api/token/refresh/`  | No Auth                       | `{"refresh": "{{refresh_token}}"}`   |

**Optional — auto-save tokens after login.** In *Authenticate* → Scripts → Post-response:

```js
const body = pm.response.json();
pm.collectionVariables.set("access_token", body.access);
pm.collectionVariables.set("refresh_token", body.refresh);
```

When the access token expires (requests start returning 401), send *Refresh Token* and put
the new `access` value into `access_token`.

---

## 5. Issues faced and fixes

| Symptom | Cause | Fix |
|---|---|---|
| Browser at `http://127.0.0.1:8000/` shows **404 Page not found** | Nothing is mapped to `/`; this is an API-only backend | Expected. Use `/admin/` in the browser, or call `/api/...` with a token |
| Browser at `/api/` shows **401** | All endpoints require a JWT; browsers don't send one | Expected. Use curl or Postman with a Bearer token |
| `bash: syntax error near unexpected token 'newline'` | URL typed as `<http://...>` — bash treats `<` / `>` as redirection | Never wrap URLs in angle brackets. `<...>` in docs means "replace this, brackets included" |
| `bash: http://localhost:8000/api/token/: No such file or directory` then `JSONDecodeError` | Same `<...>` problem: bash tried to read a file named after the URL, so curl never ran and Python got empty input | Remove the brackets; type URLs rather than pasting from sources that auto-wrap links |
| `{"detail":"No active account found with the given credentials"}` | Wrong password for the user | `python manage.py changepassword <user>` |
| `"Authorization header must contain two space-delimited values"` | `$TOKEN` was empty (login failed), so the header was just `Bearer ` | Fix login first; `echo "$TOKEN"` to confirm it's set |
| Postman **Create** (collection) fails; "Environment not found" | Postman was in *Local View* mode / a stale tab pointed at a deleted environment | Close the stale tab; switch out of Local View, or just use unsaved request tabs |
| Postman warns the request **contains secrets** on save | The raw JWT was pasted into the request | Store tokens in *secret* variables and reference `{{access_token}}` / `{{refresh_token}}`. Keep saved Postman files outside the git repo |
| **500 Internal Server Error**, `RuntimeError at /api/token/refresh` | URL missing the trailing slash. With `APPEND_SLASH=True` Django can't redirect a POST without losing the body, so it raises | Use `/api/token/refresh/`. **All API URLs end in `/`** |
| Refresh returns `401 "Token is invalid or expired"` | Access token sent instead of refresh, or refresh expired | Send the **refresh** token; if expired, log in again |
| Refresh returns `400 "This field is required."` | Body sent as Text, not JSON | Body → raw → **JSON** |
| Postman can't reach `localhost:8000` (Windows ↔ WSL) | WSL localhost forwarding not working | `python manage.py runserver 0.0.0.0:8000` |

---

## 6. API reference examples

All requests below need `Authorization: Bearer {{access_token}}`; POST/PATCH bodies are
raw JSON. `category` on a course is the category **id**; `category_name` is read-only and
appears only in responses.

### Categories — `/api/categories/`

| # | Method | URL | Body | Expect |
|---|---|---|---|---|
| 1 | POST  | `/api/categories/`   | `{"name": "Computer Science"}` | `201`, returns `id` |
| 2 | GET   | `/api/categories/`   | — | `200`, paginated list |
| 3 | GET   | `/api/categories/1/` | — | `200` |
| 4 | PATCH | `/api/categories/1/` | `{"name": "Comp Sci"}` | `200` |
| 5 | POST  | `/api/categories/`   | duplicate name | `400` (name is unique) |

### Courses — `/api/courses/`

| # | Method | URL | Body | Expect |
|---|---|---|---|---|
| 6  | POST  | `/api/courses/`   | `{"code": "CS101", "title": "Intro to Programming", "description": "Basics", "credits": 3, "category": 1}` | `201` |
| 7  | GET   | `/api/courses/`   | — | `200`, each item has `category_name` |
| 8  | GET   | `/api/courses/1/` | — | `200` |
| 9  | PATCH | `/api/courses/1/` | `{"credits": 4}` | `200` |
| 10 | POST  | `/api/courses/`   | `{"code": "CS102", "title": "X", "credits": 3, "category": 999}` | `400` (invalid category) |
| 11 | POST  | `/api/courses/`   | `{"title": "No code"}` | `400` (required fields) |

List responses are paginated (20 per page):

```json
{"count": 1, "next": null, "previous": null,
 "results": [{"id": 1, "code": "CS101", "title": "Intro to Programming",
              "description": "Basics", "credits": 3, "category": 1,
              "category_name": "Computer Science"}]}
```

### Auth and behaviour checks

| # | Test | Expect | Proves |
|---|---|---|---|
| 12 | Any GET with **No Auth** | `401` | endpoints require auth |
| 13 | Any GET with a bogus token (`abc`) | `401`, `token_not_valid` | tokens are verified |
| 14 | DELETE `/api/categories/1/` while a course uses it | **`409`** "Category still has courses" | `PROTECT` surfaced as a clean 409, not a 500 |
| 15 | DELETE `/api/courses/1/`, then repeat #14 | `204`, `204` | empty categories can be deleted |
| 16 | GET `/api/courses/999/` | `404` | — |

### N+1 check

Not visible from Postman. Covered by the automated test — run `pytest` in `backend/`
(venv active); it asserts the course list query count stays constant.

---

## 7. Stage 1 DoD checklist

- [ ] Superuser exists and can log in at `/api/token/`
- [ ] Access token lists courses (`GET /api/courses/` → 200)
- [ ] Single course readable (`GET /api/courses/1/` → 200)
- [ ] No token → 401
- [ ] Refresh flow returns a new access token
- [ ] `pytest` passes (includes the N+1 query-count test)
