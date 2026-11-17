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

The production build is written to `dist/`. Astro's sitemap integration creates `sitemap-index.xml`; `public/robots.txt` points crawlers to it.

## Routes

- `/` — profile and selected work
- `/journey/` — career and education timeline
- `/work/` — product work and independent landing-page concepts
- `/work/{slug}/` — case studies; concepts show real desktop/mobile captures, while product pages use verified notes where approved media is unavailable
- `/contact/` and `/book/` — contact and call coordination by email
- `/blog/` and `/blog/{slug}/` — articles
- `/media/` — video, podcast, and appearance archive

The two included articles are unpublished drafts. They appear locally for review and are omitted from production routes and the sitemap. Media cards remain empty until real recordings or appearances are available. Call requests open an email draft; no calendar service is connected.

## Add, edit, and publish a blog post

1. Add a Markdown file under `src/content/blog/`; its filename becomes the URL slug, e.g. `careful-retries.md` becomes `/blog/careful-retries/`.
2. Add frontmatter:

   ```yaml
   ---
   title: "A clear article title"
   description: "A concise summary for the index and search previews."
   draft: true
   readTime: "5 min read"
   tags: [reliability, engineering]
   # Optional: put optimized images in public/images/blog/.
   # coverImage: /images/blog/retries.webp
   # coverImageAlt: "A factual description of the image"
   ---
   ```

3. Write the post in Markdown beneath the frontmatter. Keep `draft: true` during review. Draft routes can be reviewed locally but do not appear in production builds.
4. To publish, set `draft: false` and add `pubDate: 2026-11-17` (use the real publication date). A published post without `pubDate`, or an image without `coverImageAlt`, fails content validation. Add `updatedDate` when a published article is materially revised.
5. Run `pnpm check` and `pnpm build`, open a pull request, and review its Vercel preview. Merge the reviewed change into the configured production branch to publish.

The Markdown pipeline renders article content. Avoid raw HTML for untrusted copy. Optimize image assets before committing and provide descriptive alt text. Edit a post by changing its `.md` file and using the same review flow.

## Feedback and admin status

There is no admin login or persisted feedback review system in this static build. The delayed feedback panel opens a `mailto:` draft for the visitor to inspect and send; it does not claim to save a submission. No visitor location is requested or collected.

Before enabling a real admin/backend, provision a private persistent PostgreSQL database and configure `DATABASE_URL`, a random `BETTER_AUTH_SECRET`, and a one-time admin bootstrap secret plus the intended admin email as protected hosting environment values. Disable public sign-up, use HTTPS and secure cookies, database-backed rate limiting, least-privilege database access, and a feedback retention policy. Remove/rotate the bootstrap secret after the first admin is created. Never put credentials in source, seeds, or committed environment files. Test sign-in, role authorization, CSRF, audit events, publishing, and feedback review end to end against the provisioned service before exposing the admin routes.

Project facts come from supplied portfolio notes. The four independent concept sites are labeled as concepts and shown with authentic screenshots from their live demos. No unverified client logos, testimonials, or outcomes are implied. Social preview artwork is `public/social-card.png`.
