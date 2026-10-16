# Forms

**Status: wired (plugin 1.7.0, 12 Oct).** The contact and quote forms send to
the plugin's own endpoint, `inc/forms.php` — not Contact Form 7. Every
submission is **saved in wp-admin under Enquiries** and **emailed** to the
address under Enquiries → Settings (`info@acrylicpros.com` by default).

## How it works

- `inc/forms.php` registers `POST /wp-json/ap/v1/enquiry` and prints
  `window.AP_FORM_ENDPOINT` into the page head. `pages.js` posts the form there
  when that is set; on the static site it is not, so the honest "not connected —
  call us" notice still shows there.
- The prototype's markup and inline validation are untouched. The server checks
  every field again against a whitelist per form; anything it refuses comes back
  as a message under that field.
- Bots: a hidden honeypot field, a 3-second minimum on the page, and five
  submissions per visitor per ten minutes. No nonce, on purpose: page caching
  would serve a stale one and fail real visitors.
- Each enquiry is a private `ap_enquiry` post. The list shows the form, email,
  phone and an **Emailed** column; "Not sent" there means the site cannot send
  mail yet (see below) — the enquiry itself is still safe.
- Email: Reply-To is the visitor, From stays on the site's own domain.
- Conversion tracking: on success `pages.js` fires GA4's `generate_lead` event
  (and pushes `ap_form_submit` to `dataLayer`), so it counts as soon as GA4 is on
  the site.
- Tested on a local WordPress (Docker): valid and invalid submissions, the
  honeypot, the rate limit, forged option values, `&`, quotes and backslashes,
  both forms from a real browser, and the admin list and settings screens.

## The fields

Preserve these `name` attributes exactly. The markup already uses them, the quote
form's `?tank=` prefill depends on them, and changing one silently breaks
whatever is reading the other end.

**Contact** — `name`, `email`, `phone`, `subject`, `interest[]`, `premises`,
`message`, `consent` (required).

**Quote** — `premises`, `name`, `company`, `email`, `phone`,
`contact_preference`, `address`, `city`, `state`, `zip`, `country`, `service`,
`length`, `width`, `height`, `water_type`, `panels[]`, `water_state`, `animals`,
`message`, `consent` (required).

`consent` is a required tick box on both. It must stay required.

**Photo upload is intentionally not a working file input.** The quote page asks
for photos by reply email or text instead. Add a real `<input type="file">` only
once there is somewhere to store what it receives, and a decision about how long
customer photos are kept.

## Why not Contact Form 7

The original plan was CF7. It would have meant rebuilding both forms in CF7's
editor and switching off the prototype's validation to avoid double-reported
errors. The endpoint keeps the markup and validation exactly as built and adds
the saved copy in wp-admin, which CF7 does not keep.

## Email deliverability — the part that actually fails

Set up SMTP before launch. PHP's own `mail()` sends unsigned
mail from a shared host, and Gmail and Outlook drop it **silently** — no bounce,
no error in WordPress, nothing in any log the client can see. The form appears to
work perfectly and the enquiries simply never arrive by email — here they are at
least saved under Enquiries, but nobody is notified.

The order:

1. **WP Mail SMTP**, pointed at real credentials — Google Workspace, or a
   transactional provider. Not the hosting account's default mail.
2. **SPF, DKIM and DMARC** records in DNS for acrylicpros.com. All three. SPF
   alone is not enough any more for Gmail.
3. **Reply-To set to the visitor's address**, and **From set to an address at
   acrylicpros.com**. Putting the visitor's address in `From` is what gets the
   whole domain marked as spoofing.
4. Send a test to a Gmail address, an Outlook address and the client's own inbox.
   Check the spam folder in each. Then look at the message's raw headers and
   confirm SPF, DKIM and DMARC all say `pass`.
5. Send one more a day later. First-send delivery and steady-state delivery are
   different things.

## Where the mail goes

`info@acrylicpros.com`, the address published across the site (confirmed with
the team, 12 Oct). Change it under **Enquiries → Settings**; several addresses
can be comma-separated.

## The chat widget

Needs nothing. It is a WhatsApp deep link and an SMS link, with no backend and no
data stored anywhere. It works the moment the page loads and it is unaffected by
any of the above.
