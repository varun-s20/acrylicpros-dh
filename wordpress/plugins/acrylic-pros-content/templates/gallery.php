<?php
/**
 * Gallery tiles. Markup copied from src/partials/gallery-grid.html; the only
 * changes are the echoes.
 *
 * The lightbox in global.js reads data-full, data-title and data-alt off the
 * button, and the filter reads data-category off the article — those four
 * attributes are the contract with the front end, not decoration.
 *
 * The prototype hand-built a <picture> with pre-generated .webp derivatives.
 * Here the srcset comes from WordPress instead, because the owner uploads one
 * file and WordPress makes the sizes. That costs the WebP variant.
 *
 * ap: JPEG/PNG only, which is a real transfer-size regression against the
 * prototype. Fix by adding a WebP-generating plugin at the Media Library
 * level, not by hand-building <picture> here — that would put the owner back
 * in the business of making derivatives.
 */

defined( 'ABSPATH' ) || exit;

/** @var array $args */
$ap_q = ap_query( 'ap_gallery', $args['count'] ?? -1 );

if ( ! $ap_q->have_posts() ) {
	// No content is not the same as a broken page. Say nothing and let the
	// section around this collapse.
	return;
}

while ( $ap_q->have_posts() ) :
	$ap_q->the_post();

	$id    = get_the_ID();
	$full  = get_the_post_thumbnail_url( $id, 'full' );
	$alt   = (string) get_post_meta( $id, '_ap_alt', true );
	$title = get_the_title();

	$terms = get_the_terms( $id, 'ap_gallery_cat' );
	$cats  = is_array( $terms ) ? implode( ' ', wp_list_pluck( $terms, 'slug' ) ) : '';

	if ( ! $full ) {
		continue; // a gallery item with no photo has nothing to show
	}
	?>
      <article class="o-referenceGrid__item" data-card data-category="<?php echo esc_attr( $cats ); ?>">
        <div class="m-referenceCard -photo">
          <div class="m-referenceCard__link">
            <h2><button class="m-referenceCard__open" type="button" data-open
                data-full="<?php echo esc_url( $full ); ?>" data-title="<?php echo esc_attr( $title ); ?>" data-alt="<?php echo esc_attr( $alt ); ?>"><span class="sr-only"><?php echo esc_html( $title ); ?></span></button></h2>
          </div>
          <?php
			echo wp_get_attachment_image(
				get_post_thumbnail_id( $id ),
				'large',
				false,
				[
					'class'    => 'm-referenceCard__image',
					// Empty alt on purpose: the button above already carries the
					// accessible name, so repeating it here makes a screen reader
					// announce every tile twice.
					'alt'      => '',
					'loading'  => 'lazy',
					'decoding' => 'async',
					'sizes'    => '(min-width: 1367px) 24vw, (min-width: 1025px) 32vw, (min-width: 641px) 48vw, 94vw',
				]
			);
			?>
        </div>
      </article>
	<?php
endwhile;

wp_reset_postdata();
