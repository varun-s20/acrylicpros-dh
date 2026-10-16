# Redirects from the old site

Load these **before** the domain switch, not after. Every one of them is a URL
that is currently indexed and currently earning traffic.

**They are built into the plugin** (`inc/redirects.php`, plugin 1.7.0), so they
go live with the site and need no redirect plugin. Nothing to load on the day.
The table below is what that file does; change both together. It covers every
URL the old acrylicpros.com published in its sitemaps (checked 12 Oct 2026), and
was tested on a local WordPress: each old URL, uppercase variants, query strings,
and the unchanged pages (which must not be redirected).

## Why most of the list is short

The old site was WordPress and the rebuild uses the same pretty-URL shape, so
most paths are unchanged and need no redirect at all:

`/gallery/`, `/contact/`, `/about/` … and every `/product/<slug>/` already match.
That is the main reason pretty URLs were chosen over keeping `.html` — the
alternative would have needed a redirect for all 95 pages, each one a chance to
mistype a slug.

## The map

| Old URL | New URL | Code |
|---|---|---|
| `/got-scratches-we-can-help/` | `/scratch-removal/` | 301 |
| `/fabrication/` | `/custom-builds-installations/` | 301 |
| `/pond-design/` | `/pond-design-construction/` | 301 |
| `/about-us/` | `/about/` | 301 |
| `/video/` | `/videos/` | 301 |
| `/shop/` | `/glass-tanks/` | 301 |
| `/product-category/aquarium-tanks/` | `/glass-tanks/` | 301 |
| `/product-category/acrylic-tanks/` | `/acrylic-tanks/` | 301 |
| `/product-category/acrylic-tanks/<range>/` (frag-tanks, rimless-tanks, …) | `/acrylic-tanks/?range=<range>` (the catalogue opens on that range) | 301 |
| `/product-category/…` (any other category, e.g. uncategorized) | `/glass-tanks/` | 301 |
| author pages, date archives, `/?s=` search | `/` | 301 (undesigned WordPress pages; the site has no blog or search) |
| `/warranty-of-products/` | `/warranty/` | 301 |
| `/refund-and-return-policy/` | `/refund-policy/` | 301 |
| `/privacy/` | `/privacy-policy/` | 301 |
| `/request-quote/` | `/quote/` | 301 |
| `/payment/` | `/contact/` | 301 |
| `/thank-you/` | `/` | 301 |
| `/new-homepage/` | `/` | 301 (old site's unfinished second homepage, page 1092) |
| `/shark-king/` | `/sharks/` | 301 |
| `/featured-projects/` | `/scratch-removal/` | 301 |
| `/wpt-testimonial/…` (3 pages) | `/about/` | 301 |
| `/blog/` and everything under it | — | 410 |
| The 4 old blog posts, which sat at the site root (`/unlocking-the-secrets-of-aquarium-maintenance/`, `/dive-into-the-depths-elevating-your-aquarium-experience-with-acrylic-pros/`, `/mastering-the-art-of-aquarium-maintenance/`, `/unlocking-the-secrets-of-thriving-aquariums-a-guide-for-beginners/`) | — | 410 |
| `/invoice/…` (Easy Invoice pages — public, with customers' names and emails) | — | 410 |
| `/category/…` (fashion, man, woman, tips — not this business) | — | 410 |

`/videos/`, `/contact/`, `/gallery/`, `/privacy-policy/` and every
`/product/<slug>/` are unchanged and deliberately **not** in the map. (An
earlier version listed `/videos/ → /videos/`, which would have looped.)

`/cart/`, `/checkout/` and `/my-account/` are handled by `inc/woocommerce.php`:
the site is quote-only (client decision, 12 Oct), so they answer with the
quote form.

## The 410, deliberately

`/blog/` returns **410 Gone**, not a 301 to the home page.

Some of those URLs are where the parasite-SEO injection lived on the compromised
install. Redirecting them to the home page passes whatever reputation they
carry — good or bad — straight to the page you most want clean. A 410 tells
Google the page is deliberately gone and to drop it, which is what you want.

If the client wants a real blog later, that is a new section with new URLs, and
these stay gone.

## Check after loading

Test by hand, on the live domain, not in a redirect-checker tool:

```
/got-scratches-we-can-help/     -> 301 -> /scratch-removal/
/shop/                          -> 301 -> /glass-tanks/
/product/120-s-gal-low-iron-glass-tank/   -> 200, no redirect
/blog/anything/                 -> 410
/a-page-that-never-existed/     -> 404, and the 404 page renders with the design
```

The last one matters: a 404 that renders in the bare theme means the Theme
Builder 404 template was never set, and it is the page most likely to be seen by
someone arriving from a stale link.
