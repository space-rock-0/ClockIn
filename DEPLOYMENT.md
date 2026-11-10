# Deploy ClockIn

The Render Blueprint at `render.yaml` defines a Python API and a static React
frontend. Supabase remains the database and authentication provider. Both
services use the same repository. Local `.env` files must never be uploaded.

## Release sequence

1. Push this project, including `render.yaml`, to the repository's `main` branch.
2. Create the Render Blueprint from that repository in the intended workspace.
3. Provide the Supabase and Google credentials from the existing backend setup.
4. Once Render assigns URLs, use the actual frontend origin as `FRONTEND_URL`
   on the API. Its CORS configuration inherits this value when
   `FRONTEND_ORIGINS` is absent. If that variable exists, set it to the same
   frontend origin. Use HTTPS, without a trailing slash.
5. Set the frontend's `VITE_API_URL` to the actual API HTTPS origin, without a
   trailing slash. Rebuild the frontend after changing any `VITE_` variable.
6. Set `GOOGLE_REDIRECT_URI` on the API to
   `https://<actual-api-host>/api/google/callback`, and redeploy the API.

The Blueprint starts with the free API plan, which may sleep when idle. Daily
in-process background jobs do not run while it sleeps. Use an always-on compute
plan if those jobs must run reliably. The website uses the static hosting CDN.

## Google Cloud settings

Open https://console.cloud.google.com/auth/clients, choose the correct project,
and edit the Web application OAuth client that matches `GOOGLE_CLIENT_ID`.

Add this exact **Authorized redirect URI**:

```text
https://<actual-api-host>/api/google/callback
```

Keep local callback entries if local development is still needed. The Calendar
flow exchanges the authorization code on the backend; the callback must point
to the API. If configuring Authorized JavaScript origins, use the frontend
origin, `https://<actual-frontend-host>` (no path).

Enable Google Calendar API in the same Google Cloud project. In Google Auth
Platform -> Audience, testing mode permits only listed test users. Add the
accounts used for release testing. Public availability requires publishing the
OAuth app and completing any Google verification required for its scopes.

## Supabase settings

Open Authentication -> URL Configuration in the same Supabase project used by
the API. Set **Site URL** to `https://<actual-frontend-host>` and add the exact
frontend redirect URLs used for email confirmation and password reset. Keep
local development URLs if needed. This is separate from the Google Calendar
backend callback.

Run `backend/database/clockin_schema.sql` only if the project has not already
been initialized. For existing databases, run `backend/database/production_security.sql`
before public release to restrict the server-only learning RPCs.
Keep `SUPABASE_SECRET_KEY` only on the API. Browser builds
receive the publishable key only. User AI keys are added in Settings; operator
OpenAI, Groq, and Anthropic environment keys are optional.

## Release verification

- Run `npm ci` and `npm run build` in `frontend`.
- Run `.venv\Scripts\python.exe -m unittest discover -s tests -v` in `backend`.
- Confirm both Render deploys reach `live` for the intended source commit.
- Request the API's `/health` and confirm Supabase is configured.
- Load the frontend and refresh `/availability` directly to verify SPA routing.
- Sign up, confirm email, sign in, create and reload a task and a note.
- Complete a timer session and verify saved stats and garden progress.
- Add a personal AI key in Settings and test the provider, then generate tasks.
- Connect Google Calendar, verify the callback returns to the live frontend,
  sync events, reload, and disconnect. Repeat with a second permitted account.
- Confirm users cannot access another user's task, note, schedule or tokens.

Local builds and unit tests do not establish that external production OAuth,
email delivery, user flows or Google verification work. Mark these checks
complete only after exercising the live app.

References:
- https://render.com/docs/blueprint-spec
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://supabase.com/docs/guides/auth/redirect-urls
