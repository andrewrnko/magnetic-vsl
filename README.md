# Magnetic LLC — conversion hero

One screen. Headline, VSL, CTA, proof, value rail. Nothing below the fold.
Cloned from the TRW hero composition and rebuilt on the Magnetic brand; the
funnel behind the button follows the whiteboard playbook (apply → three
qualifying questions → book → what-to-expect).

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
