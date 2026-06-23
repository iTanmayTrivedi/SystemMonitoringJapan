# Local Development Setup (Mac) | ローカル開発手順

Lovable's hosted preview keeps using **Lovable Cloud** automatically.
Your local clone uses **your own Supabase project** via a local `.env` file
that is git-ignored — the two never collide.

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
VITE_SUPABASE_URL="https://jskxwnlflroyvtfbkuxd.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_sohUvwWcNTtIO4w29yFNxA_0EbakIVD"
VITE_SUPABASE_PROJECT_ID="jskxwnlflroyvtfbkuxd"
```

`.env` is already in `.gitignore`, so this file stays on your machine.
The Lovable preview keeps using its own Cloud-injected values.

## 3. Provision your Supabase database

In your Supabase dashboard → **SQL Editor** → **New query**, paste the entire
contents of [`supabase/setup.sql`](./setup.sql) and click **Run**.

This creates (idempotently):

- Enums: `app_role`, `alert_severity`
- Tables: `profiles`, `user_roles`, `system_logs`, `alerts`, `alert_rules`, `metric_snapshots`
- Function: `has_role()` (SECURITY DEFINER — prevents RLS recursion)
- Trigger: `on_auth_user_created` → auto-creates profile + role on signup
- All RLS policies + GRANTs (matches the live Lovable Cloud schema 1:1)
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
supabase link --project-ref jskxwnlflroyvtfbkuxd
supabase functions deploy ai-analyze
supabase functions deploy generate-logs
supabase functions deploy demo-login
```

For `ai-analyze` you'll need a `LOVABLE_API_KEY` secret. In the Supabase
dashboard → **Edge Functions → Secrets**, add it. Without it, the AI
Insights panel will gracefully fall back to mock output.

## 6. Run the app

```bash
bun run dev        # or: npm run dev
# → http://localhost:8080
```

## 7. First sign-in

- Open `http://localhost:8080/auth`
- Switch to **Real Login** → **Sign up**
- Pick **Admin** as your role → submit
- The `on_auth_user_created` trigger will create your `profiles` row and
  insert `admin` into `user_roles` automatically
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
The Lovable preview is unaffected because `.env` is local-only and
git-ignored, while Lovable injects its own Cloud env vars at build time.
