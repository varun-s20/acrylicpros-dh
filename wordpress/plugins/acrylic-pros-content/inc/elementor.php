<?php
/**
 * Elementor's HTML widget prints its content verbatim, so any shortcode inside
 * one appears on the page as literal text — including [ap_footer], which every
 * page body ends with, and the Contact Form 7 tags on the contact and quote
 * pages. One filter fixes all of them.
 *
 * Running do_shortcode twice is harmless: the second pass finds nothing left
 * to expand.
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'elementor/widget/render_content', function ( $content, $widget ) {
	if ( 'html' === $widget->get_name() ) {
		$content = do_shortcode( $content );
	}
	return $content;
}, 10, 2 );
