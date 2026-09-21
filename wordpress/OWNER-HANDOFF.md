# Running your website

This is the guide to changing things on acrylicpros.com yourself. It assumes no
technical knowledge. Where something genuinely needs a developer, it says so
rather than pretending otherwise.

You sign in at **acrylicpros.com/wp-admin** with the username and password we
gave you.

---

## The quick answers

| I want to… | Go to |
|---|---|
| Add a photo to the gallery | **Gallery → Add New** |
| Add an Instagram post to the home page | **Instagram → Add New** |
| Add a video | **Videos → Add New** |
| Add or change a tank, or its price | **Products** |
| Change wording on a page | **Pages**, then *Edit with Elementor* |
| Change the phone number or email | See "Things that appear everywhere" below |

---

## Adding a gallery photo

1. **Gallery → Add New.**
2. **Title** — a short description, like *Curved aquarium on white cabinet*. This
   is what a visitor hears if they are using a screen reader, and it is what you
   will see in your own list later, so make it recognisable.
3. **Featured image** (right-hand side) → *Set featured image* → upload the photo.
4. **Alt text** (the box below the title) — describe what is actually in the
   picture, in a sentence. *"A tall curved-front aquarium on a white cabinet in
   the corner of an office, lit blue."* Blind visitors rely on this, and Google
   reads it.
5. **Categories** (right-hand side) — tick the ones that apply. These are what
   the filter buttons on the Gallery page use. If you invent a new category, a
   new filter button does **not** appear automatically — tell us and we will add
   it.
6. **Publish.**

**Order.** Photos appear in the order set by the **Order** box (under Page
Attributes, right-hand side). Lower numbers come first. Leave it at 0 and new
photos go to the end.

**To remove a photo:** open it and choose *Move to Bin*. It disappears from the
website immediately.

---

## Adding an Instagram post

The Instagram strip on the home page is **not** a live feed. It does not update
itself when you post. That is deliberate: the automatic versions stop working
every time Instagram changes how they log in, and they fail silently — the strip
just empties one day and nobody notices for a month.

So you add them by hand, which takes about a minute each:

1. **Instagram → Add New.**
2. **Title** — anything; you will only see it in your own list.
3. **Instagram URL** — open the post on Instagram, copy the address bar. It looks
   like `https://www.instagram.com/reel/DZkos3rAgZH/`.
4. **Caption** — the short line shown over the tile on the website. Keep it under
   about eight words or it will be cut off.
5. **Featured image** — a screenshot or the original photo. Portrait shape.
6. **Publish**, then delete the oldest one so the strip stays a dozen posts.

---

## Adding a video

1. **Videos → Add New.**
2. **Title** — this is shown under the video on the page.
3. **YouTube ID** — from the YouTube address. In
   `https://www.youtube.com/watch?v=MJFgcdNB0dA` the ID is `MJFgcdNB0dA`. Just
   that part, not the whole address.
4. **Featured image** — the picture shown before someone presses Play. If you
   leave it empty the site uses YouTube's own thumbnail, which is usually fine
   but slower.
5. **Cannot be embedded** — leave unticked and try the page. If pressing Play
   shows an error instead of the video, come back and tick this box: the card
   then sends people to YouTube instead of trying to play in place. Some videos
   are set by their owner to refuse playing on other websites, and there is
   nothing to be done about that besides ticking this.
6. **Featured** — tick for the one big video at the top. Usually only one.
7. **Publish.**

---

## Adding or changing a tank

Tanks live under **Products**. Open one to change its price, description or
photo, then press **Update**.

To add one, **Products → Add New**, and copy the layout of an existing tank —
the same category, the same style of description. The category is what puts it
into the right group on the Glass Tanks page.

**Nobody can buy online yet.** The website shows the tanks and sends people to
the quote form. Turning on real checkout — card payments, delivery charges,
sales tax — is a separate job we have not done, and it needs decisions from you
first.

---

## Changing wording on a page

**Pages** → hover the page → **Edit with Elementor**.

The page opens as one or more boxes of code. Find your sentence in it and type
over it. The text is in amongst tags that look like `<p class="tx-psmall">`.

**The rule: change the words between the angle brackets, never the brackets
themselves.**

```
<p class="tx-psmall">We have been building aquariums since 2005.</p>
                     ^^^^^^^^^ change this bit only ^^^^^^^^^
```

Press **Update** when you are done, then look at the real page.

If it comes out wrong, press the **History** button (bottom left, the arrow
icon) and revert. Nothing you can do here is permanent.

This is the honest limitation of how your site is built: the design is
hand-made, which is why it looks the way it does and not like a template, and
the trade is that text edits happen in amongst the code. Anything you expect to
change often — photos, videos, tanks, Instagram — we moved out into the proper
screens above, so you never have to touch code for those.

---

## Things that appear everywhere

The phone number, the email address, the footer links and the menu are in the
site's shared header and footer, not on any one page. They are also in about a
hundred places at once, so changing them is a developer job — it takes us
minutes, but doing it by hand risks missing some and ending up with two
different phone numbers on one website.

**Email us to change:** phone number, email address, menu items, footer links,
opening hours, address.

---

## Two things that will look broken but are not

**The forms do not send yet.** The contact and quote forms check what you type
and then tell the visitor to phone or email instead. That is on purpose and it
is honest — we would rather say so than show "thank you, we'll be in touch" for
a message that went nowhere. Connecting them properly is the next piece of work,
and it involves setting up email sending so the messages do not land in spam.

**The site may look plain for a second when it loads.** That is the smoke
animation finishing. It is meant to.

---

## If something goes wrong

1. **Reload the page** — properly: hold Shift and press the reload button.
2. **Try it in a private window**, or on your phone. Quite a few things look
   broken only because you are logged in as the administrator.
3. **If you just changed something,** undo it. In Elementor that is the History
   button; everywhere else, *Revisions* on the right-hand side.
4. **Do not deactivate plugins to see if it helps.** Turning off "Acrylic Pros —
   Site" removes the entire design at once. Nothing is lost and turning it back
   on restores everything, but the site looks destroyed in the meantime.

Then email us, and say what you last changed. That one sentence saves more time
than anything else you could send.
