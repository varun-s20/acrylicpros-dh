# Redirects from the old site

Load these **before** the domain switch, not after. Every one of them is a URL
that is currently indexed and currently earning traffic.

Use the Redirection plugin, or Yoast Premium's redirect manager. Either is fine;
doing it in `.htaccess` is also fine but harder for the client to inspect later.

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
| `/videos/`, `/video/` | `/videos/` | 301 |
| `/shop/` | `/glass-tanks/` | 301 |
| `/warranty-of-products/` | `/warranty/` | 301 |
| `/refund-and-return-policy/` | `/refund-policy/` | 301 |
| `/privacy/` | `/privacy-policy/` | 301 |
| `/request-quote/` | `/quote/` | 301 |
| `/payment/` | `/contact/` | 301 |
| `/thank-you/` | `/` | 301 |
| `/shark-king/` | `/sharks/` | 301 |
| `/blog/` and everything under it | `/` | 410 |

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
