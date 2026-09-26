Advanced Acrylics logo removal
==============================

107 images, logo removed. Same filenames as review/advanced-acrylics-logo/
(untouched originals) and as assets/images/acrylic/.

Two marks were removed:

1. The oval "Advanced Acrylics" decal stuck on the product.
   Painted out with content-aware fill, one mask per decal.

2. The Advanced Acrylics banner printed on the studio backdrop behind the
   product, plus the places it shows through or reflects off the acrylic.
   The backdrop area was repainted with the studio wall / table colour and
   the reflections were filled in.

Not fixed - 1 file:

  ref-cob100-pvchybrid-acrylic-combo-sump-ato-reservoir-and-refugium-5.jpg
  The logo here is printed over a lit reef photo mural, not a plain
  backdrop. Painting it out leaves an obvious smear because the reef
  detail behind it cannot be reconstructed. The two decals on the products
  in this shot were removed. Options: crop the top third, drop the photo,
  or have it retouched by hand.

To use these on the site: copy over assets/images/acrylic/, then run
  python tools/build_images.py      (regenerates the -400/-800 .webp variants)
  python tools/build_wordpress.py   (rebuilds the WordPress package)
