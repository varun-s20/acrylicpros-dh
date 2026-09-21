<?php
/**
 * Instagram tiles. Markup copied from src/partials/instagram-feed.html.
 *
 * These are hand-maintained posts, not a live feed. Every live-feed plugin
 * depends on a Meta access token that expires or gets rotated, and when it
 * does the strip empties silently — on the homepage. A dozen rows the owner
 * refreshes when they feel like it cannot fail that way.
 */

defined( 'ABSPATH' ) || exit;

/** @var array $args */
$ap_q = ap_query( 'ap_instagram', $args['count'] ?? 12 );

if ( ! $ap_q->have_posts() ) {
	return;
}

while ( $ap_q->have_posts() ) :
	$ap_q->the_post();

	$id      = get_the_ID();
	$link    = (string) get_post_meta( $id, '_ap_link', true );
	$caption = (string) get_post_meta( $id, '_ap_caption', true );
	if ( '' === $caption ) {
		$caption = get_the_title();
	}
	$thumb = get_post_thumbnail_id( $id );

	if ( ! $link || ! $thumb ) {
		continue;
	}
	?>
<li class="m-igTile"><a href="<?php echo esc_url( $link ); ?>" target="_blank" rel="noopener"><?php
	echo wp_get_attachment_image( $thumb, 'medium_large', false, [
		'alt'      => $caption,
		'loading'  => 'lazy',
		'decoding' => 'async',
		'sizes'    => '(min-width: 1025px) 15vw, 45vw',
	] );
?><span class="m-igTile__play" aria-hidden="true"><svg class="a-svg"><use href="#i-play"/></svg></span><span class="m-igTile__caption"><?php echo esc_html( $caption ); ?></span><span class="sr-only"> (Instagram, opens in a new tab)</span></a></li>
	<?php
endwhile;

wp_reset_postdata();
