# Run ClockIn locally

Requirements: Node.js 20.19+ or 22.12+, npm, and uv (used to install Python 3.12 and backend dependencies).

From PowerShell in this directory:

```powershell
.\start-local.ps1
```

The script creates local environment files if missing, installs dependencies, and runs both servers. Open http://127.0.0.1:5173. API health is at http://127.0.0.1:8000/health and interactive docs at http://127.0.0.1:8000/docs. Keep the script running; Ctrl+C stops both servers.

## Supabase is required

Create or connect your own Supabase project. Put its URL and publishable key in `frontend/.env.local` using `frontend/.env.example`. Put the same URL and publishable key, plus the backend-only secret key, in `backend/.env`. Never put a secret key in a `VITE_` variable. Restart after changing environment files. The legacy `anon` key remains supported as a fallback.

If your Supabase dashboard says **“No tables in schema”**, open the SQL Editor for the same project URL configured in `backend/.env` and run the complete [clockin_schema.sql](</D:/varma/PROJECTS/TO BE BUILT/Github zip/ClockIn-main/backend/database/clockin_schema.sql>) file. It creates every ClockIn table, indexes, RLS policies, Google token storage, and scheduling functions. The migration is safe to run more than once. After it finishes, refresh **Table Editor** and restart the backend. The smaller `google_calendar_schema.sql` remains available only for an already-initialized database that is missing Google token storage. Account email verification follows your Supabase project's auth settings.

## AI settings

Sign in and open **Settings → AI providers**. Add a Groq, OpenAI, or Anthropic key, optionally enter a model ID, choose a provider, test the connection, and save. The connection test makes a small real request and does not save settings. It tests the chosen provider without fallback so an invalid key is visible.

Keys are stored per user in this tab's `sessionStorage`, survive reloads, and are cleared on explicit sign-out or closing the tab. They are not synced to other browsers or stored in Supabase. Use **Clear keys** to remove them immediately. Browser-session storage remains accessible to scripts on the same origin; use only a trusted local installation. The backend only sends keys to fixed official provider endpoints and never logs or persists them.

**Auto** prefers Groq, then OpenAI, then Anthropic among configured credentials, trying the next provider if a request fails. Selecting OpenAI or Anthropic permits fallback to Groq when enabled and a Groq key is configured. Selecting Groq uses Groq only. No OpenAI key is required. User-supplied keys take precedence over operator keys; when any personal key is supplied, server keys are not mixed into that request. AI requests send assignment or task text to the provider used, including a fallback provider if enabled.

Alternatively set `GROQ_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY` in `backend/.env` for server defaults. Default model IDs can be changed with `GROQ_MODEL`, `OPENAI_MODEL`, or `ANTHROPIC_MODEL`. No AI key is required just to start the servers.

## Deployment variables

For a deployed frontend, set `VITE_API_URL` to the public backend URL, `VITE_SUPABASE_URL` to the Supabase project URL, and `VITE_SUPABASE_PUBLISHABLE_KEY` to the Supabase publishable key before building the frontend. On the backend, set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET`, `FRONTEND_URL`, `FRONTEND_ORIGINS`, and Google OAuth's `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`. `GOOGLE_REDIRECT_URI` must be the deployed backend callback URL, for example `https://api.example.com/api/google/callback`; `FRONTEND_URL` must be the deployed frontend origin, for example `https://app.example.com`. Add that exact callback URL to Google Cloud Console's authorized redirect URIs. Google Calendar uses OAuth access and refresh tokens for each user; users do not enter a Google API key in ClockIn.

The AI provider environment keys are optional operator defaults. The normal user path is Settings → AI providers: the user supplies their own Groq, OpenAI, or Anthropic key in the webpage. Those keys are sent with authenticated AI requests and are not saved in Supabase. If a user supplies any personal key, the backend does not mix it with operator keys. Remove any old keys that were committed or pasted into example files and rotate them at the provider immediately.

Implementation follows [Groq's JSON API](https://console.groq.com/docs/api-reference) and [Anthropic's Messages API](https://platform.claude.com/docs/en/api/messages/create).

## Checks

```powershell
cd frontend
npm run build
cd ../backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Google Calendar is optional and needs its own OAuth credentials. Configure Google's redirect URI to match the backend callback before connecting it.
