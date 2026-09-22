# Magnetic LLC — Magnetic × Apex

`index.html` is the hero (one screen: headline, VSL, CTA, proof) followed by
the full page: thesis, what we build, the seven-step system, the
infrastructure picker, the production engine, the thirty day buffer, the
Magnetic/Apex split, the relationship, fit, case-study placeholders, how it
starts, FAQ and the final CTA. `direct.html` is still the one-screen,
no-video lander.
Cloned from the TRW hero composition and rebuilt on the Magnetic brand; the
funnel behind the button follows the whiteboard playbook (apply → three
qualifying questions → book → what-to-expect).

## Live

https://andrewrnko.github.io/magnetic-vsl/ (repo andrewrnko/magnetic-vsl, Pages
from main). Static only, so `/api/apply` does not exist there; the form is
preview until it is pointed at a real destination. Vercel is at the 200-project
Hobby cap, `api/apply.js` (AgentMail) is ready for the day there is room.
To iterate: edit here, rsync into `~/magnetic-vsl-pages/`, commit, push.

## Run

    node server.js        # http://127.0.0.1:4850

Zero dependencies. `PORT=4890 node server.js` to move it.

## The VSL

`assets/vsl.mp4` is intentionally absent. Drop the master in and the play
button works; until then the page shows the poster frame and the button
falls back cleanly.

- The card is **2:1** (the reference shape). A 16:9 master is centre-cropped.
  To stop that, change `--vsl-ratio` in `styles.css:8` to `16 / 9`.
- Poster: `assets/poster.jpg`, a frame from `Promobox-Reel-1-4K.mp4`. Replace
  with a frame from the actual VSL once it exists.

## Leads

The apply form POSTs to `/api/apply` and appends to `leads.json` (gitignored
by absence; back it up or pipe it into the CRM). Validation runs on both
sides. On a static host (GitHub Pages) there is no endpoint, so the form is
preview only until it is pointed at a real destination.

## Assets

| file | source |
|---|---|
| `assets/poster.jpg` | frame from a real Promo Box reel |
| `assets/av1–4.jpg` | face crops from Elite NW / Got Rot / Promo Box reels |
| `assets/obj-*.png` | generated matte-black 3D props, composited with `mix-blend-mode: lighten` |

## Verified

Real Chrome at 1440×1094 (reference size), 1440×806 (laptop) and 390×844.
Video card measures 768×384 at x=336; the reference is 767×384 at x=335.
Form filled and submitted in-browser, lead written to disk, 400/422 branches
checked with curl, console clean, no horizontal scroll, no page scroll.

## The long page (added 2026-09-21)

Section styles live at the end of `styles.css` under `LONG PAGE`. Everything
above that block is the hero and is untouched.

- **Reveals** — `.r` elements fade up on intersection, staggered by index
  inside their parent. `<html class="js">` is set inline in `<head>` so the
  hidden state only applies when the script that reveals them is running;
  with JS off the page renders fully visible.
- **Sticky CTA** — `#stickyCta` shows once the hero leaves the viewport and
  hides again over the final CTA, so the same ask never appears twice. It is
  `display:none` at ≥1000px, where the navbar button carries it.
- **Infrastructure picker** — click, hover (desktop) or arrow-key a row; the
  body text swaps under it. Data lives in `data-body` on each `.pick`.
- **Case studies** — deliberate placeholders. Company / Problem / What we
  changed / Result / media slot, with no invented metrics.
- **`scroll-behavior:smooth`** is on `html`, so programmatic `window.scrollTo`
  animates. Audit scripts must pass `behavior:'instant'` or reveals will not
  have fired by the time they measure.

### Verified 2026-09-21

Real Chrome at 375×667, 390×844, 768×1024, 1440×900 and 1920×1080, and again
against the deployed https://magnetic-vsl.pages.dev: 13 sections, 19 cards,
12 FAQ rows, 15 picker rows, all 79 reveals fire, zero horizontal overflow,
zero console errors, no 4xx, picker and accordion interact.

### Deploying

Cloudflare Pages is a **direct upload** project, not git-connected. Pushing
the GitHub mirror updates `andrewrnko.github.io/magnetic-vsl` only. For
`magnetic-vsl.pages.dev`: pull an upload token from
`/accounts/{id}/pages/projects/magnetic-vsl/upload-token`, run
`promobox-vsl/tools/cfpages.js <dir>` with `CF_PAGES_JWT` set, then POST the
manifest it writes to `/pages/projects/magnetic-vsl/deployments` as
multipart. **Stage a copy without `.git` first** — `cfpages.js` skips dotted
*files* but walks dotted *directories*, so pointing it at a repo would
publish `.git`.
