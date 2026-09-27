# Local Development Setup (Mac) | ローカル開発手順

The app uses your own Supabase project. Your local clone reads its connection
settings from a git-ignored `.env` file.

---

## 1. Clone & install

```bash
git clone <your-repo-url> sysmonitor
cd sysmonitor
bun install        # or: npm install
```

## 2. Create your `.env` (local only — never committed)

Create a file named `.env` in the project root with **your** Supabase keys:

```env
VITE_SUPABASE_URL="https://uobbaqohcnjsnjeqasqz.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your publishable key from Supabase>"
VITE_SUPABASE_PROJECT_ID="uobbaqohcnjsnjeqasqz"
```

`.env` is already in `.gitignore`, so this file stays on your machine.
Hosted previews use the connection values configured for that deployment.

## 3. Provision your Supabase database

In your Supabase dashboard → **SQL Editor** → **New query**, paste the entire
contents of [`supabase/setup.sql`](./setup.sql) and click **Run**.

This creates (idempotently):

- Enums: `app_role`, `alert_severity`
- Tables: `profiles`, `user_roles`, `system_logs`, `alerts`, `alert_rules`, `metric_snapshots`
- Function: `has_role()` (SECURITY DEFINER — prevents RLS recursion)
- The app initializes its own profile + role on first sign-in
- All RLS policies + GRANTs
- Realtime publication for `system_logs`, `alerts`, `metric_snapshots`

## 4. Configure Auth in Supabase dashboard

**Authentication → Providers → Email**
- Enable **Email** provider
- (Recommended for local dev) turn ON **Auto Confirm Email** so you don't
  need to click a confirmation link every time you sign up

**Authentication → URL Configuration**
- Site URL: `http://localhost:8080`
- Redirect URLs: add `http://localhost:8080/**`

(Optional) **Google sign-in** → Providers → Google → toggle on and paste
your Google OAuth Client ID / Secret.

## 5. Deploy the edge functions (optional)

Only needed if you want the AI / log-generator features to work locally.

```bash
brew install supabase/tap/supabase     # one-time
supabase login
supabase link --project-ref uobbaqohcnjsnjeqasqz
supabase functions deploy ai-analyze
supabase functions deploy generate-logs
supabase functions deploy demo-login
```

For `ai-analyze` you'll need a `GROQ_API_KEY` secret. Add it in the Supabase
dashboard → **Edge Functions → Secrets**. Without it, AI analysis will show an error.

## 6. Run the app

```bash
bun run dev        # or: npm run dev
# → http://localhost:8080
```

## 7. First sign-in

- Open `http://localhost:8080/auth`
- Switch to **Real Login** → **Sign up**
- Pick **Admin** as your role → submit
- The app creates your `profiles` row and initial `user_roles` entry on sign-in
- You're now in. **Demo Mode** also works offline with no Supabase at all.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `permission denied for table ...` | Re-run `supabase/setup.sql` — GRANTs were skipped |
| Sign-up works but dashboard is empty | Check your row exists in `user_roles` with role `admin` |
| `Failed to fetch` on auth | Check Site URL + Redirect URLs in Supabase dashboard |
| Realtime not updating | Confirm the 3 `alter publication` lines ran without error |
| Need to promote a user | SQL Editor: `insert into user_roles(user_id, role) values ('<uuid>','admin');` |

---

## TL;DR

✅ **Yes — your project will run on your own Supabase locally.**
The local `.env` is git-ignored. Configure deployment environment variables
separately when hosting elsewhere.
