# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **/portfolio (new, 29.10.2026):** clients on Upwork who got Dmytro's proposal for a video job. They are app, game and SaaS founders or marketers deciding in a minute or two whether to reply. Upwork portfolio cards are visible only to signed-in users, so the proposal links here instead.
- **/ (home):** hiring teams for SaaS/startup roles (support, ops, product).
- **/websites:** small businesses anywhere, in English. Fixed packages. The Greek local offer was dropped on 04.11.2026: no Greek, no first-client framing, no Nea Makri.
- **/services, /automations, /apps, /videos (new, 04.11.2026):** companies reached by personalised B2B outreach, in English. Each email links to the page that matches the company's problem. They decide in a minute whether to reply or fill in the brief form.

## Product Purpose
Dmytro Nour's personal site. The /portfolio page sells one service: short AI video ads for apps, SaaS and games. Success = the client watches at least one ad and replies to the proposal or orders a package on Upwork.

## Positioning
He builds and ships his own apps (CreatorZen on iOS, Bodyclimb in progress), so his ads come from someone who knows how apps work and what users care about. One project yields several hooks and formats for testing. He labels everything honestly: own products vs spec ads for made-up brands, AI presenters disclosed.

## Operating Context
B2B pages: leads arrive through the brief form (/api/lead: email to Dmytro, optional CRM webhook, outreach utm/ref attached). Custom work is quoted first, then a deposit by payment link or invoice; /pay (noindex) lists fixed-price Stripe links. Keep /portfolio free of off-Upwork payment and of links to the B2B pages: it is linked from Upwork proposals.

Linked from Upwork proposals; opened on desktop and phones. Deals and payment go through Upwork (Project Catalog listing, $49 / $99 / $199, live since 28.10.2026). Profile: https://www.upwork.com/freelancers/~01aa982f956c4b1da4

## Capabilities and Constraints
- One shared header on all six B2B pages (since 06.11.2026, his request): Websites · Automations · Apps & Tools · Videos · Pricing (the current page's prices) · Pay for a project, current page marked, CTA "Get a quote"; one shared footer. Never per-page anchor menus. Mobile uses a native details menu instead of hiding navigation. Each service retains its own pricing/quote section and brief.
- /services#pricing is the overview; /websites#prices lists the existing fixed packages. Price ranges set 06.11.2026 at his request from market research: automations one workflow €290–790, connected system €900–2,500; apps internal tool €1,500–4,000, MVP or client portal €4,000–9,000; single video ads $49/$99/$199 (Upwork tiers). The quote is one exact figure inside the range; never invent other prices.
- /pay?service=websites shows the five website payments; /pay?service=automations|apps|videos shows the agreed custom-project payment. /pay without a service lists all six links. Payment remains for agreed work, not an unconditional purchase before scoping.
- Static HTML/CSS/JS on Vercel (www.dmytronour.work); each page is a folder with its own CSS/JS on top of the root styles.css.
- /portfolio is public: indexed and linked from the home nav (his answer 29.10).
- /portfolio shows video ads only, not websites or other services (his answer 29.10).
- Prices shown with a link to order on Upwork (his answer 29.10).

## Brand Commitments
- English everywhere.
- Header stays fixed; no hide-on-scroll (flickers on his trackpad).
- CreatorZen is the flagship product.

## Evidence on Hand
Videos and card texts in applications/upwork/portfolio-video/: CreatorZen UGC 24 s 9:16 (own app), Bodyclimb 15 s 9:16 hooks A+B (own app), VELTO 18 s + 6 s 9:16 (spec, fictional brand, 3D product + AI worlds), Northbar Futures 68 s 16:9 (spec, fictional prop firm), Rift Rovers 30 s 16:9 + 9:16 (spec, fictional game, 9 deliverables). CreatorZen: 5,000+ organic downloads (stated on profile; no proof file on disk).
No client testimonials, no reviews, no paid client results yet. Never invent them.

## Product Principles
- Let the work play first; words explain what was made and how.
- Honest labels on every piece: own product or spec, what was AI-generated.
- One clear next step: reply to the proposal or order on Upwork.
