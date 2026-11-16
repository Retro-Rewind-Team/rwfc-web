# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this is

The website for Retro Rewind (rwfc.net), a Mario Kart Wii custom track distribution built on the
Pulsar engine and played online on the Retro WFC servers. The site serves two audiences: existing
racers (downloads, room status, leaderboards, tools) and newcomers who need a clear path to
"install and race".

## Stack

| Layer    | Stack                                                                 |
| -------- | --------------------------------------------------------------------- |
| Frontend | SolidJS, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Vite      |
| Routing  | `@solidjs/router` with path routes (not hash routes), see `App.tsx`   |
| Data     | `@tanstack/solid-query`, API client in `Frontend/src/services/api`    |
| Icons    | `lucide-solid` for interface chrome, `PixelIcon` for content icons    |
| Font     | Instrument Sans Variable, self-hosted via `@fontsource-variable`      |
| Backend  | ASP.NET Core (.NET 10), EF Core, PostgreSQL                           |
| Tests    | Vitest + jsdom (frontend), xUnit v3 (backend)                         |

Note: the frontend is SolidJS, not React. Use `class` (not `className`), `<Show>`/`<For>`,
signals and `createMemo`. Do not destructure props (it breaks reactivity); use `splitProps`.

## Commands

Frontend, run from `Frontend/`:

```bash
npm ci                 # install
npm run dev            # dev server on http://localhost:3000
npm run lint           # eslint
npm run format:check   # prettier (CI runs this)
npm run type-check     # tsc --noEmit
npm run test           # vitest
npm run build          # tsc + vite build + postbuild meta generation and verification
```

To preview against live public data without running the backend:
`VITE_API_URL=https://rwfc.net/api npm run dev` (read-only GET requests; the API allows CORS).

Backend, run from `Backend/`: `dotnet build`, `dotnet format RetroRewindWebsite.csproj --verify-no-changes`.
Tests, from the repo root: `dotnet test Backend.Tests/RetroRewindWebsite.Tests.csproj`.
Docker (optional, all services): `docker compose up -d --build` from the repo root.

## Folder structure (frontend)

```
Frontend/
  index.html              base document, theme bootstrap script, JSON-LD
  public/                 static assets, robots.txt
  scripts/                postbuild: per-route meta tags, sitemap.xml, verification
  src/
    index.css             design tokens (the only place colours, type, radius are defined)
    App.tsx               routes
    components/
      common/             shared primitives: Button/ButtonLink/TextLink, Card, Section,
                          SectionHeader, PageHeader, CheckerStrip, Input, Tag (badge),
                          PixelIcon, BrandIcon (Discord,
                          GitHub), YouTubePreview, CountUp, VerifyMark, AlertBox (callout),
                          StatCard, ...
      layout/             Layout, Navbar, NavLink, Footer, ThemeToggle
      ui/<feature>/       feature components (home: Hero, TrackTicker, PlatformGuide,
                          TrackSample, RoomSnapshot, Faq; downloads; room; player; ...)
    constants/            static content and config: siteLinks, platformGuides, faq, pageMeta,
                          pageHeaders (header art per page and the screenshots still needed)
    pages/<Page>/         one folder per route
    services/api/         API client and endpoints
    hooks/ stores/ types/ utils/   (utils/homeData.ts: pure helpers behind the home page)
    __tests__/            vitest tests mirroring src/
```

## Design tokens

Defined once in `Frontend/src/index.css`. Use the semantic utilities, never raw hex or one-off values.

- Colour (semantic, switch automatically in dark mode): `canvas` (page), `surface` (subtle panels),
  `line` (borders), `line-strong` (input borders), `fg`, `fg-muted`, `fg-subtle`, `accent`,
  `accent-hover`, `accent-fg` (text on accent), `accent-text` (accent used as text),
  `accent-soft`, `warn-bg`, `warn-line`, `warn-fg`. Example: `bg-canvas text-fg border-line`.
- One neutral scale (slightly green-grey) and one accent (Retro Rewind green from the logo).
  The accent is for the primary action, links, focus rings and active nav only.
- Legacy bridge: Tailwind's `gray-*` and `blue-*` scales are remapped to the neutral and accent
  ramps so older pages match. New code should use the semantic tokens instead.
- Type: one family. Headings use the `type-display` (h1), `type-title` (h2) and `type-heading` (h3)
  utilities. Body uses `text-base`/`text-sm`; small print `text-xs`. Use `tabular-nums` for numbers.
- Spacing: Tailwind's 4px scale only. Sections use `<Section>` for consistent vertical rhythm.
- Radius: `rounded-sm` (4px, tags), `rounded-md` (6px, buttons and inputs), `rounded-lg` (8px,
  cards and panels). No other radii.
- Borders over shadows. No gradients, glass, glows or decorative animation.
- Layout width: `max-w-page` (76rem) with gutters `px-4 sm:px-6 lg:px-8`. `<main>` is a `.page-grid`:
  its children sit in the content column (aligned with header and footer); give a child the
  `full-bleed` class to span the viewport (the home hero band does). Nest another `.page-grid`
  inside a full-bleed element to realign its content.
- Hero band: always dark, using the title art's navy (`.dark.hero-band` tokens in index.css), so
  `/og-image.png` blends in with no frame. `Hero.tsx` sets `HERO_BACKGROUND` to
  `/hero/luigi-circuit.jpg` (a Mario Kart Wii screenshot), shown blurred under a solid 85% overlay
  (worst-case text contrast measured: 5.6:1 or better). With a backdrop, the hero uses the
  transparent `/RetroRewindLogo.png` instead of the title card so the wordmark has no box.
- `BackToTop` (in `Layout`) appears after one screen of scrolling, is out of the tab order while
  hidden, and moves focus to `#main-content` after scrolling up.
- Wrap every data table in `<div class="relative overflow-x-auto">`. `relative` matters: without
  it, absolutely positioned `sr-only` text inside the table escapes the scroller and widens the page.
- Motion: see "Motion" below. Only `opacity` and `transform` are ever animated.

## Component conventions

- Every internal page starts with `<PageHeader page="...">` as a direct child of the page fragment
  (so its band can go full width). It shows the title, description, optional `crumbs`, `actions`
  and `meta`. Every header has the shared gameplay backdrop (`DEFAULT_BACKDROP`, the Luigi Circuit
  screenshot) blurred under a solid 85% overlay, framed per page by `HEADER_FOCUS`. On the right
  it shows a page-supplied `visual` or framed `art` from `constants/pageHeaders.ts`; with neither,
  the text spans the full width. Use `compact` for detail, tool and text pages. Small text in the
  band uses `text-fg-muted`, not `text-fg-subtle` (subtle drops to 4.0:1 over bright parts of the
  photo).
  To add a real screenshot, put it in `public/headers/` and set `art` for that page. Do not use
  AI-generated or unlicensed images.
- The Team header uses a hand-picked list of Mii portraits (`ui/team/TeamMiis.tsx`); many profile
  pictures are personal photos or third-party characters and must not become banner art.

- Use `Button`/`ButtonLink` for every button-styled action. Variants: `primary` (one per view),
  `secondary`, `ghost`. Sizes: `sm`, `md`, `lg`, and `icon` (square, for icon-only buttons; give
  them an `aria-label`). Do not override size padding with `px-0`: it loses to `px-4`.
- Selected filter chips use `border-accent bg-accent-soft text-accent-text`; unselected use
  `border-line bg-canvas text-fg-muted`. Sortable table headers are buttons inside `<th>` with
  `aria-sort` (see `LeaderboardTable`). Numbers in tables are right-aligned with `tabular-nums`.
- Use `Card` for every bordered panel, `Section` + `SectionHeader` for every page section,
  `Tag` for small badges, `Input` for text inputs, `NavLink` for header navigation.
- Content icons use `PixelIcon` (16px grid, render at 16 or 32px). Interface icons use lucide.
  Service logos use `BrandIcon` (Discord, GitHub; paths reused from the original site), only next
  to a link to that service. There is no YouTube mark in the project; do not draw one.
- Platform picker cards use `PlatformLogo`: official marks copied verbatim (Simple Icons CC0 for
  Dolphin, Steam Deck, Linux, Apple, Android; Wikimedia Commons public-domain files for Wii and
  Windows, which Simple Icons no longer carries). All are trademarks; the Android robot is CC BY
  3.0 and its attribution line under the picker must stay. Do not swap in generic device icons.
- Video guides use `YouTubePreview`: a click-to-load facade (thumbnail only until play, then a
  youtube-nocookie.com embed). Never embed a YouTube iframe directly.
- Unconfirmed copy is flagged `verify: true` in `constants/` (or uses `<VerifyMark />`), which shows a
  visible "[verify with maintainers]" marker. Confirm with maintainers, then remove the flag.
- `Input` exists for new forms; older pages still use their own input markup (migrate when touched).
- Older pages (leaderboards, tools, rooms) only partly use these components. They inherit the tokens
  through the gray/blue bridge; migrate them to the components when you next touch them.
- External links that open a new tab must use `ButtonLink`/`TextLink` with `newTab` so screen
  readers hear "opens in a new tab".
- Every page has one `h1`, then `h2` per section, `h3` inside sections. Set `<Title>` and
  `<Meta name="description">` from `constants/pageMeta.json`.
- Shared URLs live in `constants/siteLinks.ts`. Do not hardcode them in components.

## Motion

- Tokens (index.css): `--motion-fast` 150ms (hover, focus), `--motion-base` 250ms (tabs, accordions),
  `--motion-slow` 500ms (entrances, reveals); easings `--ease-standard` and `--ease-emphasized`.
  Bare `transition-*` utilities already default to fast + standard. Use `duration-(--motion-base)`
  when you need another token. No other durations.
- Scroll reveals: spread `reveal(i)` from `utils/motion.ts` onto an element to fade and rise it once
  on entering the viewport, staggered by `i` (capped at 6). `Section` reveals its header and body;
  pass `revealBody={false}` when children stagger themselves, so nothing animates twice.
  One shared IntersectionObserver is started by `Layout`.
- Hero: `hero-enter` + `style={enterOrder(i)}`. It is transform-only on purpose; fading the hero in
  delayed LCP by ~0.85s on a throttled phone. Keep above-the-fold content visible from frame one.
- Numbers: `CountUp` counts once in view; screen readers always get the final value.
- Safety: content is only ever hidden after JS adds `.reveal-ready` to `<html>`, which it skips under
  `prefers-reduced-motion`. All keyframe motion sits inside `prefers-reduced-motion: no-preference`.
  Anything that moves for more than 5s (the track ticker) needs a pause control (WCAG 2.2.2).
- Avoid: animating layout properties (height, width, top), scroll hijacking, looping decoration.

## SEO and performance

- Per-route titles and descriptions live in `constants/pageMeta.json`. Keep titles at 60 characters
  or fewer and descriptions between 70 and 160. `scripts/generate-meta.mjs` writes per-route HTML
  with canonical and Open Graph tags plus `sitemap.xml`; `verify-meta.mjs` fails the build if any
  are missing.
- `index.html` holds the WebSite/Organization JSON-LD and an inline script that applies the theme
  before first paint (keep it in sync with `stores/theme.tsx`).
- `vite.config.ts` stops flag-icons SVGs being inlined into CSS (saves ~400 KB of render-blocking CSS).
- Images need `width`/`height` and `loading="lazy"` below the fold. Decorative images use `alt=""`.
  The home hero image (`/og-image.png`) is the exception: `loading="eager"` and `fetchpriority="high"`.
- Reserve space for anything that loads after first paint (the ticker has a fixed height, the hero
  release line reserves two lines on mobile) so layout shift stays near zero.

## Testing notes

- Components that render router links need a router in tests. Use an explicit `MemoryRouter` with
  `createMemoryHistory()` (see `__tests__/components/PlatformGuide.test.tsx`); the testing
  library's `location` option does not start this router version.
- The first test run is slow (lucide icons take ~100s to transform). Run single files while iterating.

## Copy and tone

- Plain, specific, factual. Short sentences. Sentence case for headings and buttons.
- Say what it is, who it is for and what to do next. Buttons name the action ("Get latest version").
- No em dashes. No hype words (supercharge, unleash, seamless, elevate). No emoji as icons.
- No invented stats or testimonials. Every claim must come from existing content, live API data,
  or be marked `[verify with maintainers]` until confirmed (search the code for `verify`).
- Label time-sensitive data honestly, e.g. the home page room data is a snapshot with its time.

## Git rules for agents

- Do not commit, push, branch, stash, open PRs or rewrite history unless the user asks.
- Do not stage files unless the user asks.
- Never commit `.claude/` (it is in `.gitignore`).

## Rules from CONTRIBUTING.md

- Run `npm run lint`, `npm run type-check`, `npm run build`, `npm run test` in `Frontend/` before
  submitting. CI also runs `npm run format:check`.
- Use CRLF line endings for all files (`.editorconfig`, `.gitattributes`). Prettier: 4 spaces,
  double quotes, trailing commas, print width 100.
- Comments explain the reasoning behind code, not what it does.
- Schema changes need the EF Core migration. Avoid `CASCADE DELETE`. Treat `RaceResults` and
  `GhostSubmissions` writes and deletes with extra care. Rate limiting is Cloudflare's job.
- PRs (when a human asks for one): short clear title (`fix:`/`feature:` optional), a description
  with a high-level explanation and a summary of what changed, and an **AI Usage** section if the
  work is mainly AI-generated or assisted (which parts, which tools, how it was reviewed and tested).
- AI-generated images and other assets are not accepted.
