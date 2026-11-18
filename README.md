# Saad — Portfolio

An editorial portfolio for Md Abul Hasnat Saad, a full stack engineer in Dhaka. Built with Astro for `saadsrabon.com`.

## Develop and build

```sh
pnpm install
pnpm dev
pnpm check
pnpm build
pnpm preview
```

The production build is written to `dist/`. The dynamic sitemap at `/sitemap.xml` includes published database articles and public portfolio routes; `public/robots.txt` points crawlers to it. The sitemap integration also emits a static sitemap index for prerendered routes.

## Routes

- `/` — profile and selected work
- `/journey/` — career and education timeline
- `/work/` — product work and independent landing-page concepts
- `/work/{slug}/` — case studies; concepts show real desktop/mobile captures, while product pages use verified notes where approved media is unavailable
- `/contact/` and `/book/` — contact and call coordination by email
- `/blog/` and `/blog/{slug}/` - published articles, with authenticated noindex draft previews
- `/library/` - curated, categorized resources with live counts
- `/media/` — video, podcast, and appearance archive

The two included articles are unpublished drafts; first-admin setup imports them into the content database as drafts for review. Media cards remain empty until real recordings or appearances are available. Call requests open an email draft; no calendar service is connected. Library categories start empty and are populated only with resources added and published in the admin.

## Add, edit, and publish content

Use the protected admin at `/admin/login/` after initial setup. In Articles, choose **New article**, add its title, URL slug, summary, Markdown body, and optional tags and reading time. Save as a draft while reviewing; draft preview requires the admin session and is `noindex`. Choose **Published** and save to publish the validated post at `/blog/{slug}/`; public pages and `/sitemap.xml` reflect published records. Raw HTML is removed from rendered Markdown. Markdown images are not rendered; use the cover image field with a local `/images/...` path and descriptive alt text. SEO title, description, canonical URL, and social image are also editable. There is no public sign-up.

The two existing files under `src/content/blog/` are source drafts used to seed the first admin account once. Later edits to those files do not update the database, and changing their `draft` frontmatter does not publish them. After first setup, use the admin as the source of truth for articles.

In Library, add an item with an author/source, an honest explanation, one of four categories, an HTTPS link, and optional local cover image. Save it as a draft or publish it. Counts and cards are derived from published records.

## Admin, database, and feedback

This project now uses Astro's Vercel server adapter, Better Auth, Drizzle, and PostgreSQL. Local development uses an isolated PGlite database under `.local/portfolio-db`; production requires PostgreSQL. Admin actions require the single provisioned admin role and verified TOTP MFA. The admin supports articles, Library resources, feedback status review, and a restricted audit log. Visitor feedback stores only a category and an 8–2,000 character note; it does not request a name, email, or location. Rate-limit keys are HMACed before storage. There is currently no automated feedback deletion: archive changes the review status but retains the record. Set an approved retention period before collecting real submissions.

### First production setup

Setup is disabled unless a valid, unexpired bootstrap hash and expiry are configured. Never put the code, password, or secrets in this repository, an `.env` file, a URL, chat, logs, or analytics. The owner chooses their own email and a new unique password in the browser; no email address is exposed by the setup endpoint. Email is not marked verified, since this app does not verify it. Public sign-up stays disabled.

1. Provision a private PostgreSQL database and configure `DATABASE_URL`, a random `BETTER_AUTH_SECRET` of at least 32 characters, and the exact HTTPS deployment URL as `BETTER_AUTH_URL` in the host's protected settings. Apply `pnpm db:migrate` from a secure environment. This idempotent migration adds the bootstrap claim table without deleting existing data.
2. On a trusted machine, generate a 32-byte random setup code and its SHA-256 digest. For example, run the following locally in a private terminal (avoid recorded terminals or shell history), and do not paste its output into chat:

   ```sh
   node -e "const c=require('node:crypto');const code=c.randomBytes(32).toString('base64url');console.log('Code:',code,'\nSHA-256:',c.createHash('sha256').update(code).digest('hex'),'\nExpires:',new Date(Date.now()+15*60*1000).toISOString())"
   ```

3. Put only the lowercase digest in the hosting provider's protected `ADMIN_BOOTSTRAP_HASH` setting and the printed UTC timestamp in `ADMIN_BOOTSTRAP_EXPIRES_AT`. The timestamp must be in the exact ISO format printed above, in the future and no more than 30 minutes away. Deploy the configuration securely. If deployment takes too long, generate a fresh code and digest and repeat. Transfer the code to the owner through a trusted private channel, or have them generate it themselves. Never put the code in a link.
4. The owner visits the trusted HTTPS `/admin/setup/` page directly, enters the code, their chosen email, display name and a new unique password, and submits the form. Do not reuse the password previously shared in chat. The transaction consumes the one-time claim along with creating the account and audit record. If setup fails before commit, correct the issue and retry before expiry; if it succeeds, the code cannot be replayed even if the settings remain in place.
5. Remove both bootstrap settings from the host after setup. Sign in at `/admin/login/`, enroll an authenticator before using admin tools, and store recovery codes securely. Verify login, MFA, authorization, draft preview, publication, public sign-up denial, CSRF rejection, audit entries, feedback review, sitemap entries, and backups in a preview environment before use. Database backups and suitable connection limits remain necessary.

Local checks: `pnpm test:bootstrap` (uses a temporary synthetic PGlite database), `pnpm check`, `pnpm build`, `pnpm dev`. On Windows, the Vercel adapter's local build packaging may require symlink privileges; run the final deployment build in Vercel's Linux builder if local packaging reports `EPERM` creating dependency symlinks. No production deployment or production credentials are part of this branch work.

### Cost estimate

Neon's published [Free plan](https://neon.com/pricing) is $0 with 100 CU-hours and 1 GB per project, subject to quota limits. Its Launch plan is usage-based; the provider currently shows a typical small intermittent workload at about $15/month, with compute and storage charged by actual use. [Vercel pricing](https://vercel.com/pricing) lists Hobby at $0/month and Pro at $20/month, and function usage can incur additional charges beyond included allowances. These are current public list prices, not a project-specific quote; check provider pricing and the connected Vercel plan before provisioning.

Project facts come from supplied portfolio notes. The four independent concept sites are labeled as concepts and shown with authentic screenshots from their live demos. No unverified client logos, testimonials, or outcomes are implied. Social preview artwork is `public/social-card.png`.
