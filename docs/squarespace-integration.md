# Adding the Duster character creator to your Squarespace site

The character builder is live at **https://duster-seven.vercel.app** (password: `dusty2026` while we're in preview).

Two ways to bring it onto your site.

---

## Option A: Embed directly (recommended)

Players stay on your site — the character creator appears inline on whatever page you drop it into. Best flow if players are landing on a Duster landing page and you want them to immediately start building.

1. Open the page you want the builder on in the Squarespace editor.
2. Click **+ Add Section** (or edit an existing section).
3. Choose **Code** block.
4. Paste this HTML:

    ```html
    <iframe
      src="https://duster-seven.vercel.app"
      style="width: 100%; height: 900px; border: 0; border-radius: 8px;"
      title="Duster Character Creator"
      allow="clipboard-write"
    ></iframe>
    ```

5. Click **Apply**, then **Save**.

### Height tuning

`900px` works for most desktop browsers. If you see scrollbars inside the iframe, bump the `height` value in the snippet:

- Desktop-first site → try `1000px` or `1100px`
- Mobile users will scroll naturally inside the iframe — no tuning needed.

---

## Option B: External link button

Simpler — players click a styled button and the character creator opens in a new tab. Better if you want to keep your site's visual rhythm unbroken by an embed.

1. Add a **Button** block where you want the call-to-action.
2. Set the **link** to `https://duster-seven.vercel.app`.
3. Check **Open in new tab**.
4. Set the label to something like "Build a Duster Character" or "Character Creator".

---

## Testing before you publicize

Before you link from your main site, verify the flow end-to-end:

1. Open **https://duster-seven.vercel.app** in a private / incognito window.
2. Enter the password `dusty2026`.
3. Build a test character all the way through.
4. On the final screen, click **Export Fillable PDF**.
5. Open the downloaded PDF in **Adobe Reader** (not Preview on Mac or the browser viewer — those have rendering bugs with form fields).
6. Confirm your character's info is pre-filled and the sheet matches `Mac_Sheet.pdf`.

If anything looks off, email Watson (watson@foil.engineering) with a screenshot and the character you created.

---

## Moving to your own domain (optional, when ready)

Want the builder to live at something like `occupiedhex.com/duster` instead of the Vercel URL? Watson can set up the DNS pointing from your domain to Vercel.

On your end:
- You'd add one CNAME record at your registrar (Namecheap, GoDaddy, etc.)
- Watson will send the exact target value when you're ready

No code changes on your end — purely DNS.

---

## Removing the password gate

Right now there's a password-protect gate (`dusty2026`) to keep the preview private while we're in review. When you're ready for public launch, tell Watson and he'll remove the gate. Takes about 2 minutes.

---

## Summary

| What you do | What you need |
|---|---|
| Embed on your site | Paste one iframe snippet into a Code block |
| Link from a button | Add a button pointing to the Vercel URL |
| Test before launch | 5 minutes in an incognito window |
| Custom domain | Add one DNS record; Watson sends details |
| Go public | Email Watson to remove the password gate |

No npm, no terminal, no build steps on your side. If anything in the builder itself needs tweaking, Watson does it and it's live at the Vercel URL within a few minutes of pushing.
