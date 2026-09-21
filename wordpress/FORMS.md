# Forms

**Status: not wired.** The forms render and validate; they do not send. This is
the deferred phase — see `CONVERSION-PLAN.md` §7 and §10.1.

## What ships today

Both forms carry the static site's own behaviour: full client-side validation
with inline error messages, then a notice telling the visitor the form is not
connected and offering the phone number and email instead.

That is deliberate. Showing "thank you, we'll be in touch" for a message that was
never sent is worse than having no form, and it is the failure the client would
discover from a customer rather than from us.

## The fields, when they are wired

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

## When Contact Form 7 goes in

1. Install Contact Form 7. Build each form with the field names above.
2. The plugin already runs `do_shortcode` inside Elementor HTML widgets, so the
   CF7 shortcode works when pasted into the page body. Without that filter it
   would print as literal text.
3. **Turn off the prototype's own validation on those two pages.** CF7 validates
   as well, and running both double-reports every error — the visitor sees each
   message twice. `pages.js` owns this; disable its form handling for the contact
   and quote pages rather than CF7's, because CF7's is the one tied to the
   sending.
4. Keep the inline error presentation. The prototype's is better than CF7's
   default, and the CSS for it is already in `pages.css`.

## Email deliverability — the part that actually fails

Do not connect a form until SMTP is set up. PHP's own `mail()` sends unsigned
mail from a shared host, and Gmail and Outlook drop it **silently** — no bounce,
no error in WordPress, nothing in any log the client can see. The form appears to
work perfectly and the enquiries simply never arrive.

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

**Not yet decided.** Until the client confirms a destination, the working
assumption is `info@acrylicpros.com`, which is the address published across the
site today. Confirm before wiring, and record the answer here.

## The chat widget

Needs nothing. It is a WhatsApp deep link and an SMS link, with no backend and no
data stored anywhere. It works the moment the page loads and it is unaffected by
any of the above.
