<?php
/**
 * WooCommerce as a catalogue, not a shop.
 *
 * The 237 tanks live in WooCommerce because that is where a real shop will be
 * built later (CONVERSION-PLAN.md §1). This phase has no gateway, no tax and no
 * shipping, and the static site it mirrors has no cart at all: every call to
 * action is the quote form or the phone. So nothing here is purchasable, and
 * the add-to-cart button WooCommerce would print is replaced by "Request a
 * quote", prefilled with the product exactly as the designed pages do it.
 *
 * Everything below is off unless WooCommerce is active, so the site is
 * unaffected until it is installed.
 */

defined( 'ABSPATH' ) || exit;

/** True when this product sits under the "Acrylic tanks" category. */
function ap_wc_is_acrylic( $product_id ) : bool {
	foreach ( (array) wp_get_post_terms( $product_id, 'product_cat', [ 'fields' => 'ids' ] ) as $term_id ) {
		$chain = array_merge( [ $term_id ], (array) get_ancestors( $term_id, 'product_cat' ) );
		foreach ( $chain as $id ) {
			$term = get_term( $id, 'product_cat' );
			if ( $term && ! is_wp_error( $term ) && 'acrylic-tanks' === $term->slug ) {
				return true;
			}
		}
	}
	return false;
}

/** The quote link a product's buttons point at: /quote/?kind=…&tank=… */
function ap_wc_quote_url( $product ) : string {
	$args = [ 'tank' => $product->get_name() ];
	if ( ap_wc_is_acrylic( $product->get_id() ) ) {
		$args['kind'] = 'acrylic';
	}
	return add_query_arg( array_map( 'rawurlencode', $args ), home_url( '/quote/' ) );
}

/**
 * The built body for this product, or '' when the build does not carry one.
 *
 * Matched on the post slug first, because that is what the URL is. The SKU is
 * the fallback for the case where WordPress had to suffix the slug (`-2`)
 * around a page or attachment of the same name: the CSV's SKU is the static
 * build's file name, so it still finds the right body.
 */
function ap_product_body_file( int $id ) : string {
	$product = function_exists( 'wc_get_product' ) ? wc_get_product( $id ) : null;
	$names   = [ (string) get_post_field( 'post_name', $id ) ];
	if ( $product ) {
		$names[] = (string) $product->get_sku();
	}
	foreach ( array_filter( $names ) as $name ) {
		$file = AP_DIR . 'data/products/' . sanitize_file_name( $name ) . '.html';
		if ( is_readable( $file ) ) {
			return $file;
		}
	}
	return '';
}

add_action( 'plugins_loaded', function () {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}

	// The designed product page. WooCommerce's template is a shop layout the
	// site does not use anywhere; templates/single-product.php prints the same
	// body the static build ships. Priority 99: after the theme and after
	// WooCommerce's own template loader, so this is the last word.
	add_filter( 'template_include', function ( $template ) {
		if ( is_singular( 'product' ) && ap_product_body_file( get_queried_object_id() ) ) {
			return AP_DIR . 'templates/single-product.php';
		}
		return $template;
	}, 99 );

	// Nothing can be bought: this removes every add-to-cart button, on the
	// product page and in any listing, without touching the prices.
	add_filter( 'woocommerce_is_purchasable', '__return_false' );

	// ...and in its place, the call to action the designed pages use.
	add_action( 'woocommerce_single_product_summary', function () {
		global $product;
		if ( ! $product instanceof WC_Product ) {
			return;
		}
		printf(
			'<div class="o-tank__actions">'
			. '<a class="a-button -primary -bgdarkblue -clrwhite" href="%s"><span class="tx-cta">%s</span></a> '
			. '<a class="a-button -secondary -call" href="tel:+15625660150"><span class="tx-cta">%s</span></a>'
			. '</div>',
			esc_url( ap_wc_quote_url( $product ) ),
			esc_html__( 'Request a quote', 'acrylic-pros' ),
			esc_html( '+1 (562) 566-0150' )
		);
	}, 30 );

	// Reviews are not part of this build (no ratings anywhere on the site).
	add_filter( 'woocommerce_product_tabs', function ( array $tabs ) : array {
		unset( $tabs['reviews'] );
		return $tabs;
	}, 98 );

	// Cart, checkout and account pages exist only because WooCommerce creates
	// them. Until checkout is a phase, they answer with the quote form.
	add_action( 'template_redirect', function () {
		if ( is_admin() ) {
			return;
		}
		$is_cart    = function_exists( 'is_cart' ) && is_cart();
		$is_out     = function_exists( 'is_checkout' ) && is_checkout();
		$is_account = function_exists( 'is_account_page' ) && is_account_page();
		if ( $is_cart || $is_out || $is_account ) {
			wp_safe_redirect( home_url( '/quote/' ), 302 );
			exit;
		}
	} );

	// A product URL that 404s because it is a SKU, not the slug WordPress made
	// from the name: builds before 1.5.0 linked to ".../tank-34-heavy-duty/"
	// for what WordPress calls ".../tank-3-4-heavy-duty/". Those links are out
	// there, so they go to the product -- unless it is private or a draft.
	add_action( 'template_redirect', function () {
		if ( ! is_404() ) {
			return;
		}
		$path = (string) wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ?? '' ), PHP_URL_PATH ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( ! preg_match( '#(?:^|/)product/([a-z0-9-]+)/?$#', $path, $m ) ) {
			return;
		}
		$id = wc_get_product_id_by_sku( $m[1] );
		if ( $id && 'publish' === get_post_status( $id ) ) {
			wp_safe_redirect( get_permalink( $id ), 301 );
			exit;
		}
	} );

	// The cart-fragments request runs on every page load for a cart that can
	// never have anything in it.
	add_action( 'wp_enqueue_scripts', function () {
		wp_dequeue_script( 'wc-cart-fragments' );
	}, 20 );
} );
