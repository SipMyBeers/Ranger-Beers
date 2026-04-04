# Ranger Beers Remodel — Design Spec

**Date:** 2026-04-03
**Author:** Dylan "Beers"
**Domain:** ranger-beers.com
**Entity:** BEERS LABS LLC

## Overview

Remodel ranger-beers.com from a military school supply hub into a personal brand site for Ranger Beers — Army combat medic, Ranger-qualified, website builder. The site serves three audiences: potential clients who need a site, existing site owners who want improvements, and referrers who bring clients in exchange for 10% commission on closed deals.

## Architecture

### Frontend
- Static HTML/CSS/JS on GitHub Pages (same repo: SipMyBeers/Ranger-Beers)
- SUMMON WebGPU scene (`~/Projects/portfolio/summon/`) embedded as hero background, toned down (fewer post-processing passes, reduced bloom, no CRT scanlines)
- Single-page design with scroll sections

### Backend
- Extend existing `ranger-beers-api` Cloudflare Worker
- D1 database for leads and invoices
- Simple password auth for admin route

### API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/lead` | Public | Submit a lead (all three flows) |
| GET | `/api/admin/leads` | Admin | List all leads |
| PATCH | `/api/admin/leads/:id` | Admin | Update lead status, close deal |
| GET | `/api/admin/invoices` | Admin | List all invoices |
| GET | `/api/admin/invoices/:id/pdf` | Admin | Generate/download invoice PDF |

### D1 Schema

**leads**
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID primary key |
| source | TEXT | "new_site", "existing_site", "referral" |
| lead_name | TEXT | Client name |
| lead_email | TEXT | Client email |
| lead_phone | TEXT | Client phone |
| business_name | TEXT | Nullable, for "need a site" flow |
| site_url | TEXT | Nullable, for "have a site" flow |
| need_type | TEXT | "new_site", "landing_page", "web_app", "ecommerce", "other" |
| description | TEXT | Free text (what they need / what's wrong) |
| referrer_name | TEXT | Nullable, only for referrals |
| referrer_email | TEXT | Nullable, only for referrals |
| referrer_phone | TEXT | Nullable, only for referrals |
| status | TEXT | "new", "contacted", "closed_won", "closed_lost" |
| deal_amount | REAL | Nullable, set on close |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

**invoices**
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID primary key |
| lead_id | TEXT | FK to leads |
| referrer_name | TEXT | |
| referrer_email | TEXT | |
| lead_name | TEXT | Client name for reference |
| deal_amount | REAL | Full deal amount |
| commission | REAL | 10% of deal_amount |
| status | TEXT | "unpaid", "paid" |
| created_at | TEXT | ISO timestamp |

## Homepage Layout

### Top Bar
- "RANGER BEERS" brand text, left-aligned
- No visible nav links for visitors
- "Admin" link appears only when logged in

### Hero (100vh)
- SUMMON WebGPU scene as full-bleed background
- Toned down from original: keep dithering + fluid sim, drop CRT scanlines, reduce bloom intensity
- Mouse interaction still drives fluid sim (subtle)
- Centered overlay content:
  - **"RANGER BEERS"** — large, bold
  - **Tagline** — "Army Ranger. Combat Medic. I build websites."
  - **Three buttons** (side-by-side on desktop, stacked on mobile):
    - "Need a site?"
    - "Have a site?"
    - "Have a referral?"

### Button Click Behavior
When a button is clicked, a center-stage modal/takeover expands over the dimmed SUMMON background. Each is a short stepped form.

**"Need a site?"**
1. What's your business name?
2. What do you need? (dropdown: New website, Landing page, Web app, E-commerce, Other)
3. Your name, email, phone
4. Optional: Book a call (embedded Calendly link)
5. Submit → confirmation message: "Got it. I'll be in touch."

**"Have a site?"**
1. What's your site URL?
2. What's wrong / what do you want? (free text)
3. Your name, email, phone
4. Optional: Book a call
5. Submit → confirmation message

**"Have a referral?"**
1. Your name, email, phone (the referrer)
2. Their name, email, phone (the lead)
3. What do they need? (same dropdown)
4. Submit → confirmation message: "Locked in. You'll get 10% when the deal closes."

All three flows POST to `/api/lead` with the appropriate `source` field.

### Portfolio Section (scroll down)
- SUMMON continues as dimmed persistent background
- Section heading: "BUILT BY RANGER BEERS"
- Grid of visual demo cards (screenshot thumbnail + site name):
  - Boarhog LLC (boarhogllc.com) — Defense contracting
  - Gormers (gormers.com) — AI knowledge ecosystem
  - PomoBorrow (pomoborrow.com) — Time tracking app
  - DittoMeThis (dittomethis.com) — URL analyzer
  - KillSesh (killsesh.com) — Cybersecurity platform
  - Rollick (rollick.bet) — Reseller platform
  - LootLens (lootlens.ai) — AI marketplace scanner
  - AuraJam (aurajam.com) — AI DJ tool
- Click a card → expands center-frame lightbox with larger screenshot, one-line description, "Visit Site" link

### Footer
- "BEERS LABS LLC"
- Copyright year
- Contact email

## Admin Dashboard

### Route
`/admin` on ranger-beers.com, password-protected (simple password gate).

### Inbox (default view)
Table/list of all leads:
- Source tag pill: "New Site" / "Existing Site" / "Referral"
- Lead name, email, date submitted
- Status: New → Contacted → Closed Won → Closed Lost
- Referrer name shown if applicable

### Lead Detail
Click a lead to expand:
- All submitted info displayed
- Status dropdown to update
- "Mark as Closed Won" button → prompts for deal amount
- On close of a referral lead: auto-generates invoice (10% commission) and stores in invoices table

### Invoices View
List of all generated invoices:
- Referrer name, lead name, deal amount, 10% payout, date, status (unpaid/paid)
- Click → view PDF inline
- Mark as paid button

### Invoice PDF Format
```
INVOICE

To: BEERS LABS LLC
From: [Referrer Name] / [Referrer Email]
Date: [auto-generated]
Re: Referral commission — [Lead Name]

Deal amount:      $X,XXX.XX
Commission (10%): $XXX.XX

Payment due upon receipt.
```

PDF generated server-side by the Worker on demand.

## Tech Decisions

- **No framework** — stays pure HTML/CSS/JS, consistent with current stack
- **SUMMON integration** — bundle the Three.js WebGPU scene directly into the site (vendor the built JS, not an iframe)
- **Calendly** — embedded inline in the form flow, not a separate page
- **Invoice PDFs** — generated by the Cloudflare Worker using a lightweight PDF library (e.g., pdf-lib)
- **Auth** — simple shared password for admin, no user accounts needed
- **Responsive** — mobile-first, three buttons stack vertically, portfolio cards reflow to single column
