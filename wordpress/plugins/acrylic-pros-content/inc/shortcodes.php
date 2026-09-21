<?php
/**
 * The plugin's public API. Four shortcodes, each rendering a template that
 * reproduces the prototype's markup exactly — which is the whole reason the
 * stylesheet needs no changes.
 *
 * Shortcodes return, never echo. An echoing shortcode prints at the very top
 * of the document, above everything, and reads as a collapsed layout.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Render a template with $args in scope, and never fatal on a live page.
 */
function ap_render( string $template, array $args = [] ) : string {
	$file = AP_DIR . 'templates/' . $template . '.php';
	if ( ! file_exists( $file ) ) {
		return '';
	}
	ob_start();
	include $file;
	return (string) ob_get_clean();
}

/**
 * [ap_footer] — the site footer.
 *
 * It is a shortcode rather than an Elementor Theme Builder footer because the
 * design wraps <main> and <footer> together inside .t-page > .t-page__scroller,
 * and that wrapper cannot be split across two Theme Builder templates without
 * Elementor's own closing </div> closing the scroller instead. So the footer
 * travels with the page body, and this keeps there being exactly one copy of it.
 */
add_shortcode( 'ap_footer', function () : string {
	return ap_render( 'footer' );
} );

/**
 * [ap_gallery] — the reference grid on /gallery/.
 */
add_shortcode( 'ap_gallery', function ( $atts ) : string {
	$a = shortcode_atts( [ 'count' => -1 ], $atts, 'ap_gallery' );
	return ap_render( 'gallery', [ 'count' => (int) $a['count'] ] );
} );

/**
 * [ap_instagram] — the Instagram tile strip.
 */
add_shortcode( 'ap_instagram', function ( $atts ) : string {
	$a = shortcode_atts( [ 'count' => 12 ], $atts, 'ap_instagram' );
	return ap_render( 'instagram', [ 'count' => (int) $a['count'] ] );
} );

/**
 * [ap_videos] — the video wall on /videos/.
 */
add_shortcode( 'ap_videos', function ( $atts ) : string {
	$a = shortcode_atts( [ 'count' => -1 ], $atts, 'ap_videos' );
	return ap_render( 'videos', [ 'count' => (int) $a['count'] ] );
} );
