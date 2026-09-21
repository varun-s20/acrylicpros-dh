# Go live

**Written for:** whoever performs the cutover.

This site is built on our WordPress and moves to the client's domain at launch,
so this is a migration, not just a DNS switch.

The whole build is designed to make this step small: no page body, no stylesheet
and no imported product contains a domain name. Only three things do, and
WordPress generates all three from `home_url()`. The find-and-replace is
therefore a safety net, not the mechanism.

---

## Before the day

- [ ] `python wordpress/tests/check.py wordpress/ --config wordpress/tests/check-config.json` passes
- [ ] `php wordpress/plugins/acrylic-pros-content/tests/test-acrylic-pros-content.php` passes
- [ ] Browser pass done **logged out**, caches purged (see README-WORDPRESS.md)
- [ ] The five open questions in `CONVERSION-PLAN.md` §10 are answered
- [ ] Client has confirmed: "since 2005", the SpaceX logo, the business address
      and hours, and the before/after pairings
- [ ] Legal pages read by the client: `/warranty/`, `/refund-policy/`,
      `/privacy-policy/` reproduce the old site's text verbatim, including its
      original grammar
- [ ] Redirect map loaded (`REDIRECTS.md`) — **before** the switch, not after
- [ ] SMTP configured and a test email received, or the forms are still carrying
      the "not connected" notice on purpose
- [ ] **The client's existing WordPress has been scanned and cleaned.** See the
      warning at the bottom of this file.
- [ ] Full backup of the client's current live site, downloaded and verified —
      not just sitting on the same server
- [ ] Decide and write down the rollback trigger: what, specifically, sends you
      back

---

## The move

1. **Freeze.** Nobody edits either site from here until step 9.

2. **Export the staging site.** All-in-One WP Migration, Duplicator or WP
   Migrate — any tool that does a **serialisation-safe** search-replace. Do not
   use SQL `REPLACE()` on the database: WordPress stores settings as PHP
   serialised strings that carry their own length counts, and a plain replace
   leaves those counts wrong, which silently empties Elementor templates and
   plugin settings.

3. **Import onto the client's hosting**, into a fresh database. Not on top of
   the compromised install — a fresh one.

4. **Search-replace** `https://STAGING-URL` → `https://acrylicpros.com` through
   the migration tool. Then check nothing is left:

   ```sql
   SELECT COUNT(*) FROM wp_posts   WHERE post_content LIKE '%STAGING-URL%';
   SELECT COUNT(*) FROM wp_options WHERE option_value LIKE '%STAGING-URL%';
   SELECT COUNT(*) FROM wp_postmeta WHERE meta_value LIKE '%STAGING-URL%';
   ```

   All three must be `0`. `wp_postmeta` is the one people forget, and it is
   where Elementor keeps every page's content.

5. **Re-check the settings that do not travel reliably:**
   - Settings → Permalinks → **Post name** (visit the page and press Save once,
     which rebuilds the rewrite rules)
   - Settings → Media → month/year folders still **unticked**
   - Settings → Reading → static front page still **Home**
   - Elementor → Site Settings → Layout → default colours and fonts still
     **disabled**
   - Elementor → Tools → **Regenerate CSS & Data**

6. **SSL.** Certificate issued and valid, site address and WordPress address
   both `https://`, and no mixed-content warnings in the browser console.

7. **Redirects live.** Test ten old URLs by hand from `REDIRECTS.md`, including
   `/product/<slug>/` and one of the 410s.

8. **Let search engines in:** Settings → Reading → untick *Discourage search
   engines*. This is the step that gets forgotten, and the symptom is a site
   that never appears in Google while everything looks perfect.

9. **Unfreeze**, then immediately:
   - submit the sitemap in Google Search Console
   - confirm analytics is recording
   - take a fresh backup of the now-live site

---

## After, on the same day

- [ ] Every page loads logged out, on a phone, on a real connection
- [ ] A form submission arrives — check spam as well as the inbox
- [ ] Search Console reports no coverage errors
- [ ] Automatic backups are scheduled and the first one has actually run
- [ ] Caching plugin configured, with the chat widget and the Glass Tanks filter
      excluded from JS optimisation — see `TROUBLESHOOTING.md`

---

## Rollback

Decide the trigger before you start, not while it is going wrong.

Because the old site stays untouched on its own database, rollback is: point DNS
back, and the old site is live again within the TTL. So:

- **Lower the DNS TTL to 300 seconds at least 48 hours before the move.** Do it
  now if you have not. Without this, rollback takes as long as the old TTL, which
  is often a day.
- Keep the old install running and reachable until the new one has been live and
  quiet for a week. Do not delete it on launch day.

---

## The thing that is not fixed by launching

The client's existing WordPress is **compromised** — parasite-SEO tokens injected
into the content of roughly 13 pages, two of which reached the live Yoast meta
descriptions.

None of it is in this rebuild, and `tools/check_site.py` fails if any of those
tokens ever appears. But a rebuild does not remediate the source: whatever had
write access to that install still has it, and if the new site goes onto the same
hosting account with the same credentials, it inherits the problem.

Before or at cutover, that account needs its own security pass: change every
password and hosting credential, rotate the database user, audit the users table
for accounts nobody recognises, and scan the old install's files. Treat it as a
separate job with its own sign-off — not a checkbox on this list.
