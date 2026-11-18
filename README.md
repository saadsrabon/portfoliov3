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

1. Provision a private PostgreSQL database (for example Neon) and connect it to the Vercel project through protected environment variables. Keep the database role limited to this app and enable provider backups.
2. Configure these values for the preview environment first. Never commit them or include their values in build logs:

   - `DATABASE_URL` - PostgreSQL connection URL.
   - `BETTER_AUTH_SECRET` - at least 32 characters of cryptographically random data.
   - `BETTER_AUTH_URL` - exact HTTPS deployment URL; for Vercel previews, verify the URL matches the preview host.
   - `ADMIN_EMAIL` - the sole account permitted for first-time provisioning.
   - `ADMIN_BOOTSTRAP_SECRET` - one-time random secret with at least 32 characters.

3. Run `pnpm db:migrate` from a secure environment with `DATABASE_URL` set. This applies `drizzle/0001_initial.sql`; do not put credentials into a committed `.env` file.
4. Deploy the feature branch to a Vercel preview, visit `/admin/setup/`, and enter a new password generated for this account plus the bootstrap secret. Do not reuse a password shared in chat or elsewhere.
5. Remove or rotate `ADMIN_BOOTSTRAP_SECRET` in the hosting environment, then sign in at `/admin/login/`, enroll an authenticator, and store the recovery codes securely. Vercel functions require outbound database access and suitable connection limits.
6. Verify login, MFA, draft preview, publication, public sign-up denial, CSRF rejection, audit entries, feedback review, sitemap entries, and backups on the preview before using the admin for real content.

Local checks: `pnpm check`, `pnpm build`, `pnpm dev`. On Windows, the Vercel adapter's local build packaging may require symlink privileges; run the final deployment build in Vercel's Linux builder if local packaging reports `EPERM` creating dependency symlinks. No production deployment or production credentials are part of this branch work.

### Cost estimate

Neon's published [Free plan](https://neon.com/pricing) is $0 with 100 CU-hours and 1 GB per project, subject to quota limits. Its Launch plan is usage-based; the provider currently shows a typical small intermittent workload at about $15/month, with compute and storage charged by actual use. [Vercel pricing](https://vercel.com/pricing) lists Hobby at $0/month and Pro at $20/month, and function usage can incur additional charges beyond included allowances. These are current public list prices, not a project-specific quote; check provider pricing and the connected Vercel plan before provisioning.

Project facts come from supplied portfolio notes. The four independent concept sites are labeled as concepts and shown with authentic screenshots from their live demos. No unverified client logos, testimonials, or outcomes are implied. Social preview artwork is `public/social-card.png`.
