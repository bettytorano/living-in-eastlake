# Living in Eastlake — SellingEastlake.com

Betty Torano's Eastlake website. Plain HTML pages hosted free on **Cloudflare Pages**, with the files stored on **GitHub**. Every time a change is pushed to GitHub, Cloudflare updates the live site automatically within about a minute.

- Live site (until the domain moves): https://living-in-eastlake.pages.dev
- Previews: each GitHub branch gets its own address, `https://<branch-name>.living-in-eastlake.pages.dev`

## What's in here

| File | Page |
|---|---|
| `index.html` | Home: history reels, Why Eastlake, neighborhoods, places to eat, reviews, "Before the Offer" cost factors, Meet Betty, home value form, "Let's Make a Plan" popup form |
| `about.html` | `/about`: Betty's story, Why Work with Me, reviews, credentials, FAQ |
| `buyers-guide.html` | `/buyers-guide`: HOAs, Mello-Roos, schools, buying process |
| `sellers-guide.html` | `/sellers-guide`: six-step selling process, paperwork, special situations |
| `neighborhoods.html` | `/neighborhoods`: map, 3 HOAs, 7 neighborhood cards (with ZIP codes), "Which one fits you?" |
| `life-in-eastlake.html` | `/life-in-eastlake`: things to do, why locals love it, parks & trails, getting around |
| `mello-roos-eastlake.html` | `/mello-roos-eastlake`: Mello-Roos guide |
| `eastlake-history.html` | `/eastlake-history`: timeline and Instagram reels |
| `home-value.html` | `/home-value`: seller landing page (use for seller ads) |
| `blog.html`, `blog/*.html` | Blog and posts, **generated** by `tools/build-blog.js` (do not edit the HTML directly) |
| `thank-you.html`, `form-error.html`, `404.html`, `privacy.html`, `photo-credits.html` | Supporting pages |
| `functions/api/lead.js` | Form handler: emails each lead (Resend) and sends it to Lofty |
| `assets/css/styles.css` | Colors, fonts and layout |
| `assets/js/main.js` | Menu, popup contact form |
| `assets/js/nbr-map.js` | Neighborhood boundary maps (one outline per neighborhood) |
| `assets/js/eastlake-map.js` | Interactive map on the Neighborhoods page |
| `assets/img/` | Photos. `assets/img/originals/` holds full-size and private files and is **never** published |
| `tools/posts-lofty.js`, `tools/posts-history.js` | Blog post text (including all seven neighborhood guides) |
| `tools/build-blog.js` | Builds `blog.html` and `blog/*.html` from the post files |
| `tools/seo.js` | Adds Google data (JSON-LD) and FAQ sections to pages, and rebuilds `sitemap.xml` |
| `tools/titlecase.js` | Puts section headings in Title Case (Betty's preferred style) |

## How to update the site
1. Edit page text in the `.html` files, or blog/neighborhood text in `tools/posts-lofty.js`.
2. Run `node tools/build-blog.js` then `node tools/seo.js`.
3. If you changed `styles.css` or `main.js`, raise the `?v=` number in every page so browsers load the new version.
4. Commit and push to a preview branch, check it, then merge to `main` to go live.

## Site style and content rules
- Section headings and page titles in **Title Case**.
- **No HOA dues amounts** anywhere on the site (they change).
- **Photos**: only Betty's own or licensed photos. No Google, Google Earth or MLS images.
- **Neighborhood boundaries** are Betty's own drawings traced onto OpenStreetMap. Never copy Lofty/MLS boundary data.
- **Fair housing**: describe places and home types, not people (avoid "family-friendly", "safe", "ideal for families").
- Service area: Eastlake specialist, serving buyers and sellers **throughout San Diego County**.
- Mello-Roos = CFDs only. Eastlake Maintenance District #1 (OSD 101) is a city assessment, **not** Mello-Roos.
- Neighborhood ZIP codes: Hills & Shores 91913 · Trails North & The Woods 91914 · Greens, Trails & Vistas 91915.
- No ZIP-level home values on the homepage: each ZIP covers more than Eastlake, so the numbers mislead.
- **Text messages (A2P 10DLC)**: every lead form has an optional, unchecked SMS consent box (`sms_consent`) naming Torano Realty Inc.; only text leads who checked it (GHL tag "SMS Opt-In"). Registered via GoHighLevel MANUAL A2P setup (no chat widget). SMS terms: /terms#sms and /privacy#sms. Keep the box when adding new forms.

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

## Still to do
- Move SellingEastlake.com DNS from GoDaddy to Cloudflare (step 3 above), then delete or redirect the posts that were moved from the Lofty site.
- Add the Lofty API key so leads also go into Lofty.
- Send a test message from the "Let's Make a Plan" popup and the home value form.

## Making changes later
Edit the `.html` files (any text editor works), then commit and push to GitHub. Cloudflare redeploys automatically.

To preview locally: `npx wrangler pages dev .` and open http://localhost:8788
