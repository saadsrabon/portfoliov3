# Saad · Portfolio

An editorial portfolio for Md Abul Hasnat Saad, a full stack engineer in Dhaka. Built with Astro as a static site for `saadsrabon.com`.

## Develop and build

```sh
pnpm install
pnpm dev
pnpm check
pnpm build
pnpm preview
```

The production build is written to `dist/`. Astro’s sitemap integration creates `sitemap-index.xml`; `public/robots.txt` points crawlers to it.

## Routes

- `/` — profile and selected projects
- `/journey/` — career and education timeline
- `/work/` — project summaries
- `/contact/` and `/book/` — direct contact and call coordination by email
- `/blog/` — writing index
- `/blog/payments-that-can-be-retried/` and `/blog/email-imports-that-recover/` — editorial drafts
- `/media/` — video, podcast, and appearance archive

The article pages are unpublished drafts. They carry `noindex` and are excluded from the sitemap. Media cards are empty states until real recordings or appearances are available. Call requests open an email draft; no calendar or booking service is connected.

## Update portfolio content

Edit `src/data/site.ts` for profile details, verified project summaries, the timeline, and the clearly labeled article drafts. Shared page metadata and navigation live in `src/layouts/SiteLayout.astro`; design tokens and responsive styles are in `src/styles/global.css`.

Project descriptions are based on the supplied portfolio design source. The site uses no invented client marks, testimonials, or published media. Social preview artwork is `public/social-card.png`.
