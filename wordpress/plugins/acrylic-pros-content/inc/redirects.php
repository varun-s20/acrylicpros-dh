<?php
/**
 * Old-site URLs: where each one goes now.
 *
 * Built in rather than typed into a redirect plugin at launch, so the map ships
 * tested with the site and cannot be mistyped on the day. It covers every URL
 * the old acrylicpros.com published in its sitemaps (pages, posts, invoices,
 * testimonials, categories), checked 12 Oct 2026. Products need nothing: all 69
 * /product/<slug>/ URLs are unchanged.
 *
 * 301 = moved; the page lives on under a new address.
 * 410 = gone on purpose. Used for the old blog (where the parasite-SEO
 *       injection lived -- see REDIRECTS.md for why not a 301), the public
 *       invoice pages (they exposed customers' names and emails), the junk
 *       post categories, and the testimonial single pages.
 *
 * Runs on every request but only acts on a path in the map, so it costs a
 * string comparison. A real page at the same path would be shadowed, which is
 * why none of these paths is used by the new site.
 */

defined( 'ABSPATH' ) || exit;

/** Exact old path (no trailing slash) => new path, or 410. */
function ap_redirect_map() : array {
	return [
		'/got-scratches-we-can-help' => '/scratch-removal/',
		'/fabrication'               => '/custom-builds-installations/',
		'/pond-design'               => '/pond-design-construction/',
		'/about-us'                  => '/about/',
		'/video'                     => '/videos/',
		'/shop'                      => '/glass-tanks/',
		'/product-category/aquarium-tanks' => '/glass-tanks/',
		// WooCommerce's own category archives are undesigned; each acrylic one
		// opens the designed catalogue on that range instead (pages.js reads
		// ?range=). Any other acrylic category: the prefix rule below.
		'/product-category/acrylic-tanks'                   => '/acrylic-tanks/',
		'/product-category/acrylic-tanks/accessories'       => '/acrylic-tanks/?range=accessory',
		'/product-category/acrylic-tanks/auto-top-off'      => '/acrylic-tanks/?range=ato',
		'/product-category/acrylic-tanks/cube-nano-pico'    => '/acrylic-tanks/?range=cube',
		'/product-category/acrylic-tanks/display-tanks'     => '/acrylic-tanks/?range=display',
		'/product-category/acrylic-tanks/dosing-containers' => '/acrylic-tanks/?range=doser',
		'/product-category/acrylic-tanks/frag-tanks'        => '/acrylic-tanks/?range=frag',
		'/product-category/acrylic-tanks/rimless-tanks'     => '/acrylic-tanks/?range=rimless',
		'/product-category/acrylic-tanks/sumps-refugiums'   => '/acrylic-tanks/?range=sump',
		'/warranty-of-products'      => '/warranty/',
		'/refund-and-return-policy'  => '/refund-policy/',
		'/privacy'                   => '/privacy-policy/',
		'/request-quote'             => '/quote/',
		'/payment'                   => '/contact/',
		'/thank-you'                 => '/',
		// The old site's unfinished second homepage (page 1092), still published.
		'/new-homepage'              => '/',
		'/shark-king'                => '/sharks/',
		'/featured-projects'         => '/scratch-removal/',
		// The old blog's posts sat at the site root, not under /blog/.
		'/unlocking-the-secrets-of-aquarium-maintenance'                            => 410,
		'/dive-into-the-depths-elevating-your-aquarium-experience-with-acrylic-pros' => 410,
		'/mastering-the-art-of-aquarium-maintenance'                                => 410,
		'/unlocking-the-secrets-of-thriving-aquariums-a-guide-for-beginners'        => 410,
	];
}

/** Old path prefix => new path, or 410. Everything under it. */
function ap_redirect_prefixes() : array {
	return [
		'/blog'            => 410,
		'/category'        => 410,  // fashion, man, woman, tips: not this business
		'/invoice'         => 410,  // Easy Invoice pages, public with customer details
		'/wpt-testimonial' => '/about/',
		'/product-category/acrylic-tanks' => '/acrylic-tanks/',
		// Any other shop category ("Uncategorized", one added later): the
		// archive is undesigned, the glass catalogue is the designed listing.
		'/product-category' => '/glass-tanks/',
	];
}

/** The rule for a request path, or null. */
function ap_redirect_for( string $path ) {
	$path = strtolower( '/' . trim( $path, '/' ) );
	$map  = ap_redirect_map();
	if ( isset( $map[ $path ] ) ) {
		return $map[ $path ];
	}
	foreach ( ap_redirect_prefixes() as $prefix => $target ) {
		if ( $path === $prefix || 0 === strpos( $path, $prefix . '/' ) ) {
			return $target;
		}
	}
	return null;
}

add_action( 'template_redirect', function () {
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}
	$path = (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '', PHP_URL_PATH );
	// A WordPress in a subfolder: compare against the path below it.
	$base = (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH );
	if ( '/' !== $base && 0 === strpos( $path, rtrim( $base, '/' ) ) ) {
		$path = substr( $path, strlen( rtrim( $base, '/' ) ) );
	}

	$rule = ap_redirect_for( $path );
	if ( null === $rule ) {
		return;
	}

	if ( 410 === $rule ) {
		// Render the site's own 404 page, but say 410 Gone.
		global $wp_query;
		$wp_query->set_404();
		status_header( 410 );
		nocache_headers();
		return;
	}

	$target = home_url( $rule );
	if ( ! empty( $_SERVER['QUERY_STRING'] ) ) {
		$target .= ( false === strpos( $target, '?' ) ? '?' : '&' ) . wp_unslash( $_SERVER['QUERY_STRING'] );
	}
	wp_safe_redirect( $target, 301, 'Acrylic Pros' );
	exit;
}, 1 );

/**
 * WordPress's own author, date and search pages.
 *
 * The site has no blog and no search box, so these are undesigned leftovers
 * (/author/acrylicpros/, /2024/06/, /?s=...): noindex, but still a bare page
 * for anyone who lands there, and the author page names the admin login.
 * They go to the homepage. Runs before redirect_canonical (priority 10), so
 * /?author=1 never reaches its own redirect to the author page either.
 */
add_action( 'template_redirect', function () {
	if ( is_admin() || ! ( is_author() || is_date() || is_search() ) ) {
		return;
	}
	wp_safe_redirect( home_url( '/' ), 301, 'Acrylic Pros' );
	exit;
}, 2 );

/**
 * Keep the user list out of the public REST API.
 *
 * /wp-json/wp/v2/users listed the site's login names to anyone. Signed-in
 * users keep it -- the editors use it.
 */
add_filter( 'rest_endpoints', function ( $endpoints ) {
	if ( is_user_logged_in() ) {
		return $endpoints;
	}
	foreach ( array_keys( $endpoints ) as $route ) {
		if ( 0 === strpos( $route, '/wp/v2/users' ) ) {
			unset( $endpoints[ $route ] );
		}
	}
	return $endpoints;
} );
