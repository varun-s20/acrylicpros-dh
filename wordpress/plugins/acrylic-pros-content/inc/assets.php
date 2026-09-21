<?php
/**
 * The per-tier stylesheets and scripts, the <html> and <body> classes the
 * design depends on, and the nav key the header needs.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Which stylesheets and scripts this page needs.
 *
 * The static site loads three different combinations, and merging them into
 * one bundle silently changed the cascade for any page that did not originally
 * load all three — two single-class rules that never met now met, and load
 * order picked the winner. So the sets are reproduced exactly:
 *
 *   home    home.css                       lenis + home.js
 *   inner   home.css + pages.css           lenis + pages.js + home.js
 *   legacy  + legacy.css                   + main.js
 *
 * Order matters in both lists. pages.css after home.css, and pages.js before
 * home.js because pages.js clears the loader that home.js then assumes is gone.
 */
function ap_asset_set() : array {
	$body = ap_current_shell()[0];

	if ( false !== strpos( $body, 't-legacy' ) ) {
		return [
			'css' => [ 'home.css', 'pages.css', 'legacy.css' ],
			'js'  => [ 'lenis.min.js', 'pages.js', 'home.js', 'main.js' ],
		];
	}

	if ( false !== strpos( $body, 't-home' ) ) {
		return [
			'css' => [ 'home.css' ],
			'js'  => [ 'lenis.min.js', 'home.js' ],
		];
	}

	return [
		'css' => [ 'home.css', 'pages.css' ],
		'js'  => [ 'lenis.min.js', 'pages.js', 'home.js' ],
	];
}

/**
 * Switch off Hello Elementor's own stylesheets.
 *
 * This is the fix for the pink borders, the wrong heading and paragraph
 * spacing, and the mis-sized images — all three come from one file. The
 * theme's reset.css is far more invasive than the famous pink link:
 *
 *   a                              { color: #c36 }
 *   [type=submit], button          { border: 1px solid #c36; color: #c36;
 *                                    padding: .5rem 1rem }
 *   h1..h6                         { font-weight: 500; margin-block-start: .5rem;
 *                                    margin-block-end: 1rem }
 *   p                              { margin-block-end: .9rem }
 *   body                           { color: #333; font-family: -apple-system…;
 *                                    line-height: 1.5 }
 *
 * Out-specifying all of that is a losing game: `[type=submit]` is an attribute
 * selector at (0,1,0), so any neutraliser strong enough to beat it also beats
 * the design's own single-class button rules and strips them instead. That is
 * exactly what happened when the neutraliser was scoped with `#main button`.
 *
 * home.css carries a complete reset of its own — box-sizing, zeroed margins,
 * `a { color: inherit }`, `button { padding: 0; border: 0 }` — so nothing here
 * depends on the theme's. Removing it is what makes the cascade match the
 * static site instead of merely fighting it.
 *
 * Priority 100: the theme enqueues at the default 10, so this has to run after.
 */
add_action( 'wp_enqueue_scripts', function () {
	foreach ( [
		'hello-elementor',                // reset.css
		'hello-elementor-theme-style',    // theme.css
		'hello-elementor-header-footer',  // header-footer.css
	] as $handle ) {
		wp_dequeue_style( $handle );
		wp_deregister_style( $handle );
	}
}, 100 );

/**
 * Enqueue this page's set, after Elementor.
 *
 * filemtime() rather than AP_VER as the cache-buster, because the file's own
 * timestamp cannot fall out of step with the file — a hand-bumped constant
 * can, and does. Uploading a new home.css and forgetting to bump AP_VER used
 * to mean every visitor kept the cached old one; filemtime() makes that
 * mistake impossible.
 */
add_action( 'wp_enqueue_scripts', function () {
	$set = ap_asset_set();

	// Each file depends on the one before it, which is how the load order is
	// guaranteed. The first depends on elementor-frontend so the whole chain
	// lands after the builder's own CSS.
	//
	// Checked rather than assumed: wp_enqueue_style with a dependency that is
	// not registered enqueues nothing at all, silently. If Elementor is
	// deactivated or renames that handle, an unchecked dependency would take
	// the entire design off the site with no error anywhere.
	$deps = wp_style_is( 'elementor-frontend', 'registered' )
		? [ 'elementor-frontend' ]
		: [];

	foreach ( $set['css'] as $file ) {
		$handle = 'ap-' . sanitize_key( str_replace( '.', '-', $file ) );
		$path   = AP_DIR . 'assets/' . $file;
		wp_enqueue_style(
			$handle,
			AP_URL . 'assets/' . $file,
			$deps,
			file_exists( $path ) ? filemtime( $path ) : AP_VER
		);
		$deps = [ $handle ];
	}

	$prev = null;
	foreach ( $set['js'] as $file ) {
		$handle = 'ap-' . sanitize_key( str_replace( '.', '-', $file ) );
		$path   = AP_DIR . 'assets/' . $file;
		wp_enqueue_script(
			$handle,
			AP_URL . 'assets/' . $file,
			$prev ? [ $prev ] : [],
			file_exists( $path ) ? filemtime( $path ) : AP_VER,
			true
		);
		wp_script_add_data( $handle, 'defer', true );
		$prev = $handle;
	}
}, 20 );

/**
 * The design's own <html> classes.
 *
 * `is-loading` gates the smoke loader and `js` gates every progressive
 * enhancement in the stylesheet. Both have to be on the element before first
 * paint — adding them from JS would flash the un-enhanced page first.
 */
add_filter( 'language_attributes', function ( $output ) {
	return $output . ' class="is-loading js"';
} );

/**
 * The page shell class.
 *
 * `t-home`, `t-shop`, `t-inner t-about` and the rest set the shell background
 * and drive the header's colour sampling. A page with the wrong one renders in
 * the wrong palette, which is the single most likely way this build breaks
 * after someone adds a page.
 */
add_filter( 'body_class', function ( array $classes ) : array {
	return array_merge( $classes, explode( ' ', ap_current_shell()[0] ) );
} );

/**
 * Hand the nav key to the front end.
 *
 * Priority 1 so it lands before the deferred home.js runs -- home.js carries
 * the nav-highlighting shim, and it falls back to deriving the key from the
 * pathname if this is missing, so deactivating the plugin costs the menu
 * highlight and nothing else.
 */
add_action( 'wp_head', function () {
	printf(
		"<script>window.AP_NAV=%s;</script>\n",
		wp_json_encode( ap_current_shell()[1] )
	);
}, 1 );

/**
 * Which shell the current request wants: [ body class, nav key ].
 */
function ap_current_shell() : array {
	$map = ap_page_map();

	if ( is_front_page() ) {
		return $map['front'];
	}

	if ( function_exists( 'is_singular' ) && is_singular( 'product' ) ) {
		return [ ap_product_body_class(), 'glass-tanks' ];
	}

	if ( function_exists( 'is_post_type_archive' )
		&& ( is_post_type_archive( 'product' ) || ( function_exists( 'is_shop' ) && is_shop() ) ) ) {
		return $map['glass-tanks'] ?? [ 't-inner t-shop', 'glass-tanks' ];
	}

	$post = get_queried_object();
	if ( $post instanceof WP_Post && isset( $map[ $post->post_name ] ) ) {
		return $map[ $post->post_name ];
	}

	// Anything unmapped — a new page, a search result, the 404 — gets the
	// neutral inner shell. It will look plain rather than broken, which is the
	// right way for an unknown page to fail.
	return [ 't-inner', '' ];
}
