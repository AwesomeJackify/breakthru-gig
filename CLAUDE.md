# Breakthru — Astro Media Project

## Project stage

- [x] Launchpad — base project scaffolded
- [x] Stardraft — wireframe build
- [ ] Client wireframe approval
- [ ] Liftoff — production build with brand, forms, integrations

## Client

- Name: Breakthru
- Slug: breakthru

## Base stack

- Astro 6 + Tailwind v4 + DaisyUI v5 (wireframe theme)
- ESLint (flat config) + Husky + lint-staged
- Node 22.12.0+ required (engines field in package.json)

## Before starting any session

1. Run `npm install` if node_modules is missing
2. Run `npm run dev` to start the dev server

## Conventions

- CSS: src/styles/global.css — DaisyUI theme set via @plugin directive
- Images: always use Astro `<Image />` — never raw `<img>`
- No React unless a component genuinely needs client-side state
- DaisyUI wireframe theme active until Liftoff
- **All client-editable text lives in `breakthru.config.json`** (project root) — components import from it, never hardcode copy inline

## Dependency policy

Versions are pinned. To update:
npx npm-check-updates -u
npm install
npm run build && npm run test
Then commit updated package-lock.json and update Launchpad agent templates.

## Adding integrations (when needed)

### Cloudflare Pages deployment

npm install @astrojs/cloudflare
Add to astro.config.mjs: adapter: cloudflare(), output: "static"

### Icons (astro-icon + Lucide)

npm install astro-icon @iconify-json/lucide
Add to astro.config.mjs: integrations: [icon()]
Usage: `<Icon name="lucide:arrow-right" />`

### Animations (GSAP)

npm install gsap@3.12.5
Use in component <script> tags. Register ScrollTrigger where needed.
Pair with split-type for text animations: npm install split-type@0.3.4

### Database + Auth (Supabase)

npm install @supabase/supabase-js@2.45.1
Create src/lib/supabase.ts
Always use server-side Astro API routes — never expose keys client-side
Add to .env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

### Payments (Stripe)

npm install stripe@17.7.0 @stripe/stripe-js@4.10.0
Payment intent creation always server-side via Astro API routes
Add to .env: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET

### Form handling — responses to client email (Resend)

npm install resend
Create src/pages/api/contact.ts as an Astro API route
Responses go directly to client's email address
Add to .env: RESEND_API_KEY

### Blog / CMS (Astro Content Collections)

No extra install — built into Astro 6
Create src/content/config.ts and define collections there
Import Zod from astro/zod (not directly from zod — Astro 6 uses Zod 4)

### E-commerce

Combine Stripe (payments) + Supabase (product/order data)

## Stardraft complete

- [x] Stardraft — wireframe built

### What was built

- Inspo site copied: https://www.hudamustafacoaching.net/
- Site type: single page scroll
- Pages: index.astro
- Sections (in order): Nav, Hero, About, Offers, Testimonials, Services, Lead Form, Footer
- Components: Nav, Hero, About, Offers, Testimonials, Services, LeadForm, Footer
- Assets used: hero.jpeg (Hero section), logo.png (Nav), workout video-portrait.mp4 (About section — rendered at aspect-[9/16])

### Asset naming convention

Asset filenames describe their content and, where relevant, their orientation — treat the name as a literal description of what the asset shows or contains. For example, a file named "workout-video.mp4" is a video of people working out; "myer-portrait.jpg" is a portrait photo of Myer. When placing assets, use the filename to infer appropriate context, alt text, and placement within the layout. If a filename includes "portrait" (e.g. "workout-video-portrait.mp4"), render the element with a portrait aspect ratio (aspect-[9/16]). If it includes "landscape", use a landscape ratio (aspect-video). If no orientation is specified, default to square (aspect-square).

### Adaptations from inspo

- Inspo has pricing tiers (Bombshell Body, Mamacita Method) — replaced with coaching pillar cards (Training, Nutrition, Mindset) to match Breakthru's Phase 1 brief (no online payments)
- Inspo has an app download section — omitted (Phase 2 portal scope only)
- Added Testimonials section between Offers and Lead Form as required by client brief — uses card grid with star ratings and avatar placeholders
- Inspo coaching form embedded in hero — moved to dedicated Lead Form section per brief

### Non-functional elements

- Lead qualification form (data-stardraft="non-functional" on form and submit button)
- Submit button disabled with "Form submission coming in build phase" badge
- All 6 testimonial card avatar placeholders (STARDRAFT comment) — replace with real client photos and quotes

### Content file

All site copy is managed from `breakthru.config.json` at the project root. Every component imports from it — no text is hardcoded inline. To hand copy to the client or swap placeholder text at Liftoff, edit only this file.

### Notes for Liftoff

- **Copy:** fill all placeholder text in `breakthru.config.json` with real content from Myer — search for `[ X ]` to find outstanding gaps
- Hero image: hero.jpeg is live — confirm with Myer this is the preferred hero shot or swap at Liftoff
- About section: workout video-portrait.mp4 is live as autoplay loop at aspect-[9/16] portrait ratio — confirm with Myer or swap for a still portrait if preferred
- All card icon skeletons in Offers need real icons (astro-icon + Lucide recommended)
- Testimonials: replace all placeholder quotes and avatar initials with real client testimonials and photos from Myer
- Lead form action + Resend API route to wire up on Liftoff
- Confirm brand tokens (dark green + black hex codes, fonts) with Myer before Liftoff begins

### Next stage: Liftoff

Awaiting client wireframe approval.
When approved:

1. Mark wireframe approved in status
2. Confirm brand tokens (colours, fonts) from client
3. Run Liftoff agent
