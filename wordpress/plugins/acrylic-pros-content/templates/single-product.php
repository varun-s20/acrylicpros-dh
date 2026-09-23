<?php
/**
 * A product page, rendered from the designed body rather than WooCommerce's.
 *
 * WooCommerce's own single-product template is a shop layout: gallery left,
 * summary right, tabs below, all of it styled by the theme. The static site's
 * product page is none of those things -- it has the page banner with its
 * breadcrumb, the o-tank grid, the spec accordions, the trust list and the
 * sibling tanks at the foot, and every one of those is a design class in
 * pages.css. Reproducing that through WooCommerce's hooks would be a second
 * implementation of markup this build already emits, so the built body is
 * shipped in data/products/ and printed here instead, exactly as the pages are.
 *
 * inc/woocommerce.php only routes here when that file exists, so a product
 * added in wp-admin later still gets WooCommerce's template.
 */

defined( 'ABSPATH' ) || exit;

$ap_body = ap_product_body_file( get_queried_object_id() );

get_header();

if ( $ap_body ) {
	// Shipped with the plugin, not user input: printed as the page, and
	// do_shortcode() so [ap_footer] renders as it does on every other page.
	echo do_shortcode( file_get_contents( $ap_body ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

get_footer();
