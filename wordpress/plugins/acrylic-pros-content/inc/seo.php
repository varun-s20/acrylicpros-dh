<?php
/**
 * Page titles, meta descriptions and share tags.
 *
 * Every page and product of the custom site has a written <title>, description
 * and og: tags. inc/seo-map.php (generated) carries them; this file hands them
 * to Yoast, so the WordPress pages read the same in search results and when
 * shared -- instead of Yoast's default "Home - Acrylic Pros".
 *
 * A title or description typed into Yoast's box for a page or product still
 * wins: these are only the default. Products are in the map because the acrylic
 * tanks have no short description or featured image in WooCommerce, so Yoast
 * alone printed no description and no share image for them (live, 13 Oct).
 *
 * Without Yoast, the same values go out through WordPress's own title and a
 * plain set of meta tags, so the site is never left without them.
 */

defined( 'ABSPATH' ) || exit;

/** The map row for the page being viewed: [ title, desc, og title, og desc, og image ]. */
function ap_seo_current() : ?array {
	if ( ! function_exists( 'ap_seo_map' ) ) {
		return null;
	}
	if ( is_front_page() ) {
		$key = 'front';
	} elseif ( is_page() ) {
		$key = (string) get_post_field( 'post_name', get_queried_object_id() );
	} elseif ( is_singular( 'product' ) ) {
		// Keyed by the built file's name, which is the product's SKU -- the
		// same lookup as ap_product_body_file(). WordPress's own slug differs
		// for some ("…-3-8-thick-…" for 3/8", where the build has "…-38-…").
		$map     = ap_seo_map();
		$product = function_exists( 'wc_get_product' ) ? wc_get_product( get_queried_object_id() ) : null;
		foreach ( [ $product ? (string) $product->get_sku() : '', (string) get_post_field( 'post_name', get_queried_object_id() ) ] as $name ) {
			if ( '' !== $name && isset( $map[ 'product:' . $name ] ) ) {
				return $map[ 'product:' . $name ];
			}
		}
		return null;
	} else {
		return null;
	}
	$map = ap_seo_map();
	return $map[ $key ] ?? null;
}

/** What was typed into Yoast for this page, if anything. */
function ap_seo_typed( string $field ) : string {
	$id = get_queried_object_id();
	return $id ? trim( (string) get_post_meta( $id, '_yoast_wpseo_' . $field, true ) ) : '';
}

function ap_seo_image_url( string $file ) : string {
	return $file ? home_url( '/wp-content/uploads/' . rawurlencode( $file ) ) : '';
}

/** [ map index, Yoast meta field it defers to ] for each Yoast filter. */
function ap_seo_yoast_fields() : array {
	return [
		'wpseo_title'                => [ 0, 'title' ],
		'wpseo_metadesc'             => [ 1, 'metadesc' ],
		'wpseo_opengraph_title'      => [ 2, 'opengraph-title' ],
		'wpseo_opengraph_desc'       => [ 3, 'opengraph-description' ],
		'wpseo_twitter_title'        => [ 2, 'twitter-title' ],
		'wpseo_twitter_description'  => [ 3, 'twitter-description' ],
	];
}

foreach ( ap_seo_yoast_fields() as $filter => $spec ) {
	add_filter( $filter, function ( $value ) use ( $spec ) {
		$row = ap_seo_current();
		if ( ! $row || '' === $row[ $spec[0] ] || '' !== ap_seo_typed( $spec[1] ) ) {
			return $value;
		}
		return $row[ $spec[0] ];
	}, 20 );
}

/**
 * og:image when Yoast has none of its own -- which is every page here, since
 * none has a featured image. wpseo_opengraph_image below only rewrites an image
 * Yoast already found, so on its own it printed no og:image at all (live site,
 * 13 Oct: twitter:image present, og:image missing).
 */
add_action( 'wpseo_add_opengraph_images', function ( $images ) {
	$row = ap_seo_current();
	if ( ! $row || '' === $row[4] || '' !== ap_seo_typed( 'opengraph-image' ) ) {
		return;
	}
	if ( is_object( $images ) && method_exists( $images, 'has_images' ) && ! $images->has_images() ) {
		$images->add_image_by_url( ap_seo_image_url( $row[4] ) );
	}
} );

foreach ( [ 'wpseo_opengraph_image' => 'opengraph-image', 'wpseo_twitter_image' => 'twitter-image' ] as $filter => $field ) {
	add_filter( $filter, function ( $value ) use ( $field ) {
		$row = ap_seo_current();
		if ( ! $row || '' === $row[4] || '' !== ap_seo_typed( $field ) ) {
			return $value;
		}
		// A product with photos of its own (the glass tanks) keeps Yoast's: it
		// lists each of them, and rewriting every one to the same file printed
		// that og:image twice (live, 13 Oct).
		if ( 'opengraph-image' === $field && is_singular( 'product' ) ) {
			return $value;
		}
		return ap_seo_image_url( $row[4] );
	}, 20 );
}

/* -------------------------------------------------------------------------
   Without Yoast: WordPress's own <title> plus plain meta tags
   ------------------------------------------------------------------------- */

add_filter( 'pre_get_document_title', function ( $title ) {
	if ( defined( 'WPSEO_VERSION' ) ) {
		return $title;
	}
	$row = ap_seo_current();
	return $row ? $row[0] : $title;
}, 20 );

add_action( 'wp_head', function () {
	if ( defined( 'WPSEO_VERSION' ) ) {
		return;
	}
	$row = ap_seo_current();
	if ( ! $row ) {
		return;
	}
	printf( "<meta name=\"description\" content=\"%s\">\n", esc_attr( $row[1] ) );
	printf( "<meta property=\"og:title\" content=\"%s\">\n", esc_attr( $row[2] ?: $row[0] ) );
	printf( "<meta property=\"og:description\" content=\"%s\">\n", esc_attr( $row[3] ?: $row[1] ) );
	if ( $row[4] ) {
		printf( "<meta property=\"og:image\" content=\"%s\">\n", esc_url( ap_seo_image_url( $row[4] ) ) );
	}
}, 3 );

/* -------------------------------------------------------------------------
   Yoast's sitemap: only what the site actually serves (client, 13 Oct)
   ------------------------------------------------------------------------- */

/**
 * Content types the old site published that now answer 410 or redirect:
 * Easy Invoice pages (their addresses carry customers' names), the old blog
 * posts, and the testimonial singles. Their records stay in wp-admin; only
 * the sitemap stops offering them to Google.
 */
add_filter( 'wpseo_sitemap_exclude_post_type', function ( $excluded, $post_type ) {
	return in_array( $post_type, [ 'easy_invoice', 'wpt-testimonial', 'post' ], true ) ? true : $excluded;
}, 10, 2 );

/**
 * The old blog's categories (fashion, man, woman, tips) and tags, and the shop
 * categories: WooCommerce's category archives are undesigned, and every one of
 * them redirects to /glass-tanks/ or the acrylic catalogue (inc/redirects.php).
 */
add_filter( 'wpseo_sitemap_exclude_taxonomy', function ( $excluded, $taxonomy ) {
	return in_array( $taxonomy, [ 'category', 'post_tag', 'product_cat' ], true ) ? true : $excluded;
}, 10, 2 );

/**
 * The old site's pages still published at addresses inc/redirects.php now
 * sends elsewhere (/about-us/, /fabrication/ ...): listing a URL that
 * redirects tells Google the wrong address.
 */
add_filter( 'wpseo_exclude_from_sitemap_by_post_ids', function ( $ids ) {
	if ( ! function_exists( 'ap_redirect_for' ) ) {
		return $ids;
	}
	$pages = get_posts( [ 'post_type' => 'page', 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids' ] );
	foreach ( $pages as $id ) {
		if ( null !== ap_redirect_for( '/' . get_page_uri( $id ) . '/' ) ) {
			$ids[] = (int) $id;
		}
	}
	return array_values( array_unique( array_map( 'intval', (array) $ids ) ) );
} );

/**
 * The shop archive (/shop/) and the old "Aquarium tanks" category both
 * redirect to /glass-tanks/ (inc/redirects.php), so neither belongs in the
 * sitemap. Same test as the pages above: a category whose address the
 * redirect map sends elsewhere is left out.
 */
add_filter( 'wpseo_sitemap_post_type_archive_link', function ( $link, $post_type ) {
	return 'product' === $post_type ? false : $link;
}, 10, 2 );

add_filter( 'wpseo_exclude_from_sitemap_by_term_ids', function ( $ids ) {
	if ( ! function_exists( 'ap_redirect_for' ) || ! taxonomy_exists( 'product_cat' ) ) {
		return $ids;
	}
	$terms = get_terms( [ 'taxonomy' => 'product_cat', 'hide_empty' => false ] );
	foreach ( is_array( $terms ) ? $terms : [] as $term ) {
		$path = (string) wp_parse_url( (string) get_term_link( $term ), PHP_URL_PATH );
		if ( '' !== $path && null !== ap_redirect_for( $path ) ) {
			$ids[] = (int) $term->term_id;
		}
	}
	return array_values( array_unique( array_map( 'intval', (array) $ids ) ) );
} );
