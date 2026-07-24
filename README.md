# Saad · Personal Brand Site (MVP)

Premium scroll-driven personal brand site. Placeholders are active until you add real content.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Update placeholders

Edit **`src/lib/placeholders.ts`** for:

- Profile (name, email, location)
- Image URLs
- Trust metrics
- Community links
- Resume availability

Edit **`src/lib/copy.ts`** for section headlines and case study narratives.

## MVP features

- Entry gate with guided / skip paths
- GSAP scroll chapters (pinned process, horizontal cases)
- Dark / light theme (`D` key or nav icon)
- Terminal easter egg (`Cmd+K`, type `resume`)
- Keyboard shortcuts (`?`)
- Scroll progress indicator

## Strategy

See **`STRATEGY.md`** for full IA, copy system, and phase roadmap.

## Deploy

```bash
pnpm build
pnpm start
```

Deploy to Vercel or any Node host.
# portfoliov3
