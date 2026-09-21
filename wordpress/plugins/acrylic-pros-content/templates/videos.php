<?php
/**
 * Video cards. Markup copied from src/pages/videos.body.html.
 *
 * Two variants, and the difference is not cosmetic:
 *
 *   normal    click-to-load. data-yt, data-yt-title, data-yt-play and
 *             data-yt-mount are the contract with global.js, which builds the
 *             iframe on demand. Nothing is requested from YouTube until the
 *             visitor presses Play.
 *   -external YouTube refuses to embed this particular video, so the card
 *             links out instead. It carries no data-yt at all -- leaving it in
 *             would give global.js a player to mount that then fails to load.
 *
 * Three of the eight videos are external. Getting this wrong ships a player
 * that spins forever, which is why it is a field the owner can see and set
 * rather than something inferred here.
 */

defined( 'ABSPATH' ) || exit;

/** @var array $args */
$ap_q = ap_query( 'ap_video', $args['count'] ?? -1 );

if ( ! $ap_q->have_posts() ) {
	return;
}

while ( $ap_q->have_posts() ) :
	$ap_q->the_post();

	$id    = get_the_ID();
	$yt    = (string) get_post_meta( $id, '_ap_youtube', true );
	$title = get_the_title();
	$thumb = get_post_thumbnail_id( $id );

	if ( ! $yt ) {
		continue; // no ID, nothing to play and nothing to link to
	}

	$external = '1' === (string) get_post_meta( $id, '_ap_external', true );
	$featured = '1' === (string) get_post_meta( $id, '_ap_featured', true );
	$watch    = 'https://www.youtube.com/watch?v=' . rawurlencode( $yt );
	$sizes    = $featured
		? '(min-width: 1025px) 90vw, 94vw'
		: '(min-width: 1025px) 45vw, 94vw';

	$cover = $thumb
		? wp_get_attachment_image( $thumb, 'large', false, [
			'class'    => 'b-video__cover',
			'alt'      => '',
			'loading'  => 'lazy',
			'decoding' => 'async',
			'sizes'    => $sizes,
		] )
		// No local thumbnail: fall back to YouTube's own. That is the one
		// remote request this page otherwise avoids, so it stays a fallback
		// and never the default.
		: sprintf(
			'<img class="b-video__cover" src="https://i.ytimg.com/vi/%s/maxresdefault.jpg" alt="" width="1280" height="720" loading="lazy" decoding="async">',
			esc_attr( $yt )
		);
	?>
        <article class="m-videoCard<?php echo $featured ? ' -featured' : ''; ?>">
          <div class="m-videoCard__player b-video<?php echo $external ? ' -external' : ''; ?>"<?php
			if ( ! $external ) {
				printf( ' data-yt="%s" data-yt-title="%s"',
					esc_attr( $yt ), esc_attr( $title ) );
			}
			?>>
            <div class="b-video__placeholder">
              <?php echo $cover; ?>
			<?php if ( $external ) : ?>
              <a class="b-video__playButton" href="<?php echo esc_url( $watch ); ?>" target="_blank" rel="noopener">
                <svg class="a-svg" aria-hidden="true"><use href="#i-youtube"/></svg>
                <span class="tx-ctasmall -txupp -tx600">Watch on YouTube</span>
                <span class="sr-only">: <?php echo esc_html( $title ); ?> (opens in a new tab)</span>
              </a>
			<?php else : ?>
              <button class="b-video__playButton" type="button" data-yt-play>
                <svg class="a-svg" aria-hidden="true"><use href="#i-play"/></svg>
                <span class="tx-ctasmall -txupp -tx600">Play</span>
                <span class="sr-only">: <?php echo esc_html( $title ); ?></span>
              </button>
			<?php endif; ?>
            </div>
            <div class="b-video__iframe"<?php echo $external ? '' : ' data-yt-mount'; ?>></div>
          </div>
          <div class="m-videoCard__meta">
            <h3 class="m-videoCard__title"><?php echo esc_html( $title ); ?></h3>
            <a class="m-videoCard__link tx-cta" href="<?php echo esc_url( $watch ); ?>" target="_blank" rel="noopener"><svg class="a-svg" aria-hidden="true"><use href="#i-youtube"/></svg>YouTube<span class="sr-only"> (opens in a new tab)</span></a>
          </div>
        </article>
	<?php
endwhile;

wp_reset_postdata();
