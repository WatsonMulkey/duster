# FOIL-Side Prep — Before Emailing the Client

This is what *Watson* does before sending the client their go-live checklist.
None of these steps belong in the client's doc — they're FOIL plumbing.

For Duster specifically, this runs once. For future client engagements,
copy this file's shape: every Vercel-hosted custom-domain handoff has these
same prep steps with different values.

---

## When to run

You're at the moment where:
- The client has answered your questions (subdomain, plan tier, DNS host,
  page location, PDF/review status).
- You have everything except `{{VERCEL_CNAME_TARGET}}` to fill into
  `docs/andrew-golive-checklist.md`.
- You haven't emailed them yet.

You're about to: provision the subdomain in Vercel, capture the CNAME target
it issues, fill the checklist, and send the email.

---

## Step 1 — Add the subdomain to the Vercel project

1. Go to the **Duster** project in the Vercel dashboard.
2. **Settings → Domains → Add**.
3. Enter the client's chosen subdomain (e.g., `character.occupiedhex.com`).
4. Vercel will display verification instructions, including a CNAME target
   like `cname.vercel-dns.com`. **Copy this target value verbatim.** This
   is what becomes `{{VERCEL_CNAME_TARGET}}` in the client checklist.
5. Vercel also issues an SSL cert automatically once DNS resolves. No action
   needed; just be aware the first request after DNS propagation may take
   a few extra seconds while the cert provisions.

If Vercel says "domain is already registered to another project" — check
whether `occupiedhex.com` apex or another subdomain on it is already on
another Vercel project. Resolve that conflict before continuing; Vercel
won't let you double-claim.

---

## Step 2 — Verify the build is current on the deploy alias

Vercel's auto-deploy might not have caught the latest push. Verify:

```bash
git log -1 --oneline                              # local HEAD
curl -s https://duster-seven.vercel.app | grep -o 'index-[A-Za-z0-9-]*\.js'
```

The hashes in the bundle name should reflect a build that includes the
latest changes. If the deployed bundle is stale, trigger a rebuild:

```bash
cd C:/Users/watso/Dev/duster
npx vercel --prod=false
```

Wait for the deploy to land (Vercel will tail the build log).

---

## Step 3 — Pre-test against the actual deploy URL

Verified once for the Duster engagement and not expected to need re-running
for similar future engagements (Vite + pdf-lib + Vercel + iframe embed):

- ✅ End-to-end wizard against `npm run preview` produces a correctly-filled
  PDF (verified 2026-04-27 via `scripts/inspect-pdf.mjs`).
- ✅ Cross-origin iframe scenario (parent on a different port iframes the
  app) reaches and triggers the Export download successfully in Chrome
  (verified 2026-04-27 with a 2-port local test).
- ✅ Vercel deploy headers don't include `X-Frame-Options` or restrictive
  `Content-Security-Policy: frame-ancestors` (verified via `curl -sI` on
  `duster-seven.vercel.app`).

For a future engagement on the same stack, you can skip rerunning the
cross-origin test and rely on these prior results unless the deploy host or
embed surface changes materially.

The Playwright + pdf-lib walkthrough you ran earlier was against
`npm run preview`. That validates the production bundle locally. This step
validates the *Vercel-served* bundle — same code, but with whatever Vercel
adds (headers, edge config, env vars baked in).

```bash
# From duster project root
node scripts/inspect-pdf.mjs <path-to-PDF-you-export-via-Playwright>
```

Use the deploy URL with the password gate still up. You're checking three
things:

1. **Functional**: wizard completes, PDF exports, fields populated correctly.
2. **Visual** (Adobe Reader): open the exported PDF, scan the inventory box
   (specialty items + bonus item all visible, multi-line wraps cleanly),
   spot-check that nothing else regressed since the last review.
3. **Console**: no new errors in browser devtools.

If anything fails, fix and redeploy *before* sending Andrew the checklist.

---

## Step 4 — Fill the checklist + email

Open `docs/andrew-golive-checklist.md`. Follow the instructions in the
HTML comment at the top:
- Replace every `{{PLACEHOLDER}}` with concrete values.
- Delete the conditional sections that don't apply (DNS-host branch,
  plan-tier path).
- Delete the comment block itself.

Save it as a copy in whatever format works for the client (Markdown email,
PDF, attached `.md` — Andrew has previously accepted Markdown in email).

Send the email. Subject line that worked before:
> "Duster character creator — go-live setup"

Include in the body:
- One-line context ("Here's the step-by-step we talked about — should be
  ~30 minutes start to finish").
- The filled-in checklist (paste or attach).
- An offer to walk them through any step over a quick call if they prefer.

---

## Step 5 — While client works, watch for triggers

Set yourself a reminder to check in if you don't hear back in 48 hours.
The most common stall points are:
- DNS propagation taking longer than expected (usually means the registrar
  has an unusual TTL or the CNAME was entered wrong).
- Squarespace Code Block UI moved, client can't find it.
- Adobe Reader not installed; client tested in Preview/browser viewer and
  saw rendering bugs unrelated to actual issues.

Each of those has a 30-second answer once they ask.

---

## Step 6 — When client confirms, run the cutover runbook

Cross-link: `docs/cutover-runbook.md`. That doc handles password-gate
removal, public deploy, and rollback if needed. Don't run cutover until
the client has affirmatively said "looks good, ready for public".

---

## Blueprint note

For future client handoffs (next FOIL engagement on Vercel + custom
subdomain), copy this shape:
- Step 1 (Vercel subdomain provisioning) is identical for every client.
- Step 2 (verify build is current) is universal.
- Step 3 changes only in *what's* visually verified — keep the structure.
- Step 4 (fill placeholders + send) is universal once the client checklist
  exists.
- Step 6 (cutover) is universal — every preview-then-public flow has one.

The actual `client-name-golive-checklist.md` is what varies most: domain
setup branches, plan-specific embed instructions, project-specific verify
items. Don't try to abstract those before you've done at least 3 client
handoffs. Patterns reveal themselves with repetition.
