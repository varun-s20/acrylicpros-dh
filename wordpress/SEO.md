# SEO

## Structured data — already done, do not duplicate

The 22 JSON-LD graphs from the static site ship in the plugin as
`inc/schema.php`, generated from `src/schema/*.json`. They cover the
`LocalBusiness`, the `WebSite`, each page type and every breadcrumb trail.

Two things about how they work:

- **`{{SITE}}` is replaced with `home_url()` when the graph is printed.** Schema
  is one of the few places a spec demands an absolute URL, so it could not be
  root-relative like the rest of the build. The placeholder means the structured
  data is right on staging and right again after the domain move, with nothing
  to search and replace.
- **Yoast's own graph is switched off** (`wpseo_json_ld_output` → false).
  Shipping both leaves two entities claiming the same `@id` for the same
  business, and search engines resolve that unpredictably. If the hand-written
  graphs are ever dropped, remember to turn Yoast's back on — otherwise the site
  ends up with none at all.

To change the graphs, edit `src/schema/*.json` and re-run
`python tools/build_wordpress.py`. Editing `inc/schema.php` directly is
overwritten on the next build.

## Yoast configuration

Yoast still does titles, meta descriptions, the XML sitemap, and OG/Twitter tags.

- **Titles and descriptions** come from each page's meta block in
  `src/pages/*.body.html`. Port them page by page; they are written and not
  placeholders.
- **OG image** per page is already named in the same meta block.
- **Search appearance → Content types → Media → redirect attachment URLs to the
  parent: Yes.** With 458 images uploaded, leaving this off publishes 458 thin
  attachment pages, each one a URL Google can index instead of a real page.
- **Search appearance** — set the organisation to Acrylic Pros with the logo, so
  Yoast's non-schema output agrees with the hand-written graph.
- **Noindex** the WooCommerce cart, checkout and account pages if WooCommerce
  creates them, even though checkout is not configured yet.

## Things the graph deliberately does not claim

These are not omissions to fix. They are missing because the facts were never
confirmed, and inventing them is worse than their absence:

- **No `address`.** The `LocalBusiness` carries `areaServed` but no street
  address, because none exists anywhere on the live site. Supply a real one and
  it can be added — `LocalBusiness` schema with a made-up address is a
  liability, not an optimisation.
- **No `AggregateRating`.** A Google Business Profile exists but no rating was
  verified. Review markup without real, compliant source data is a manual action
  waiting to happen. Do not add it from memory of "about 4.8".
- **No opening hours**, for the same reason as the address.

## Before launch

- Redirect map loaded — see `REDIRECTS.md`.
- `Discourage search engines` **unticked** on the live domain. This is the step
  that gets forgotten; the site then looks perfect and never ranks.
- Sitemap submitted in Google Search Console, and the old site's Search Console
  property kept so you can watch the redirects resolve.
- Confirm none of the injected spam tokens from the compromised install appear
  anywhere: `Bitnex`, `Crestfort`, `Valtrion`, `Juvthorix`, `Invexus`. They are
  in the forbidden-strings list in `tests/check-config.json`, so
  `wordpress/tests/check.py` fails if any of them ever reaches the build.
