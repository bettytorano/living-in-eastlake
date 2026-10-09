# Living in Eastlake — SellingEastlake.com

Betty Torano's Eastlake website. Plain HTML pages hosted free on **Cloudflare Pages**, with the files stored on **GitHub**. Every time a change is pushed to GitHub, Cloudflare updates the live site automatically within about a minute.

## What's in here

| File | Page |
|---|---|
| `index.html` | Home: Betty's story, history reels, neighborhoods, home value form |
| `home-value.html` | `/home-value`: seller landing page (use for seller ads) |
| `buyers-guide.html` | `/buyers-guide`: HOAs, Mello-Roos, schools (use for buyer ads) |
| `neighborhoods.html` | `/neighborhoods`: all 7 Eastlake neighborhoods |
| `eastlake-history.html` | `/eastlake-history`: timeline and Instagram reels |
| `thank-you.html`, `form-error.html`, `404.html`, `privacy.html` | Supporting pages |
| `functions/api/lead.js` | Form handler: emails each lead and sends it to Lofty |
| `assets/css/styles.css` | Colors, fonts and layout |
| `assets/img/` | Photos (see `assets/img/README.txt` for file names) |

---

## One-time setup

### 1. Create a GitHub account and repository
1. Sign up at https://github.com/signup.
2. Click **+ → New repository**. Name it `living-in-eastlake`, choose **Private**, and **do not** add a README. Click **Create repository**.
3. Copy the repository URL (it looks like `https://github.com/YOURNAME/living-in-eastlake.git`).
4. Send that URL to Claude, which will upload the files. The first time, a GitHub sign-in window opens and you sign in yourself.

### 2. Create a Cloudflare account and connect GitHub
1. Sign up at https://dash.cloudflare.com/sign-up.
2. Go to **Workers & Pages → Create → Pages → Connect to Git**, authorize GitHub, and pick `living-in-eastlake`.
3. Build settings: **Framework preset: None**, **Build command: (leave empty)**, **Build output directory: `/`**. Click **Save and Deploy**.
4. You get a free preview address like `living-in-eastlake.pages.dev`. Check the site there first.

### 3. Move SellingEastlake.com from GoDaddy DNS to Cloudflare
You keep the domain registered at GoDaddy. Only the DNS ("address book") moves to Cloudflare, which is free.
1. In Cloudflare: **Add a domain → `sellingeastlake.com` → Free plan**. Cloudflare shows two nameservers (for example `xxx.ns.cloudflare.com`).
2. In GoDaddy: **My Products → sellingeastlake.com → DNS → Nameservers → Change → "I'll use my own nameservers"** and paste the two Cloudflare nameservers.
3. Also in GoDaddy, **remove the domain forwarding** to bettytorano.com/living-in-eastlake.
4. Wait for Cloudflare's email saying the domain is active (usually under an hour, sometimes up to 24 hours).
5. In Cloudflare **Workers & Pages → living-in-eastlake → Custom domains**, add `sellingeastlake.com` and `www.sellingeastlake.com`.

### 4. Turn on the lead forms
Forms email you via **Resend** (free up to 3,000 emails/month) and also go into **Lofty**.

**Email (Resend)**
1. Sign up at https://resend.com, then go to **Domains → Add domain → `sellingeastlake.com`**. Because DNS is now at Cloudflare, use the **"Sign in to Cloudflare"** button to add the records automatically.
2. Under **API Keys**, create a key with "Sending access".

**Lofty**
1. In Lofty, go to **Settings → Integrations → Open API** (or ask Lofty support for an "Open API key") and generate a key.
2. Lofty's API details can change. If leads don't appear in Lofty after a test, see https://developer.lofty.com (create lead: POST /v1.0/leads, header "Authorization: token <API key>"). Set `LOFTY_API_URL` only if Lofty changes its base address (default https://api.lofty.com/v1.0). Email delivery keeps working either way.

**Add the settings in Cloudflare**: go to **Workers & Pages → living-in-eastlake → Settings → Variables and Secrets** and add these for **Production**:

| Name | Type | Value |
|---|---|---|
| `RESEND_API_KEY` | Secret | your Resend key |
| `LEAD_TO_EMAIL` | Text | `betty.torano@exprealty.com` (comma-separate to add more) |
| `LEAD_FROM_EMAIL` | Text | `Living in Eastlake <leads@sellingeastlake.com>` |
| `LOFTY_API_KEY` | Secret | your Lofty key |

Then **Deployments → ⋯ → Retry deployment** so the settings take effect. Submit a test form and confirm the email arrives and the lead appears in Lofty.

### 5. Meta Pixel (for ads)
In Meta Events Manager, create a Pixel, copy its base code, and paste it into every page where the `<!-- META PIXEL -->` comment is. The thank-you page already fires a **Lead** event, so Meta can optimize ads for actual form submissions.

### 6. Google
Add the site in Google Search Console (https://search.google.com/search-console) and submit `https://sellingeastlake.com/sitemap.xml`.

---

## Before going live, please check
- **Broker DRE number** in the footer (`#01878277` for eXp Realty of California, Inc.). Confirm it with eXp.
- **Neighborhood descriptions** in `neighborhoods.html`. Add your own insider details (home styles, parks, price ranges).
- **Photos**: add them to `assets/img/` (names listed in `assets/img/README.txt`).
- **Testimonials**: none are on the site yet. Send them over and they can go on the home page.

## Making changes later
Edit the `.html` files (any text editor works), then commit and push to GitHub. Cloudflare redeploys automatically.

To preview locally: `npx wrangler pages dev .` and open http://localhost:8788
