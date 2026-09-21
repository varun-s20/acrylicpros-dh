<?php
/**
 * One-time seeding of the gallery, Instagram and video libraries.
 *
 * This is the client's real content, carried over from the static site — not
 * demo data. It still only ever runs when someone presses the button, and it
 * is safe to press twice: every item is matched by its source key first, so a
 * second run updates rather than duplicates.
 *
 * It expects the images to be in the Media Library already, matched by
 * filename, which is why wordpress/media/ is uploaded before this is run.
 *
 * REMOVE THIS FILE AFTER HANDOVER. It is one menu click away from being run on
 * a site whose owner has since curated the library by hand, and while it will
 * not duplicate anything, it will put back items they deleted.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_menu', function () {
	add_management_page(
		'Import Acrylic Pros content',
		'Acrylic Pros import',
		'manage_options',
		'ap-import',
		'ap_import_page'
	);
} );

function ap_import_page() : void {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'You do not have permission to do this.' );
	}

	echo '<div class="wrap"><h1>Import Acrylic Pros content</h1>';

	if ( isset( $_POST['ap_import'] ) && check_admin_referer( 'ap_import' ) ) {
		$result = ap_run_import();
		printf(
			'<div class="notice notice-success"><p>Gallery: %d. Instagram: %d. Videos: %d. Images not found in the Media Library: %d.</p></div>',
			(int) $result['ap_gallery'],
			(int) $result['ap_instagram'],
			(int) $result['ap_video'],
			(int) $result['missing']
		);
		if ( $result['missing'] ) {
			echo '<div class="notice notice-warning"><p>Items whose image was not found were still created, without a photo. Upload the missing files to the Media Library and run this again — it updates rather than duplicates.</p><p><code>'
				. esc_html( implode( ', ', array_slice( $result['missing_files'], 0, 20 ) ) )
				. '</code></p></div>';
		}
	}

	echo '<p>Creates the gallery photos, Instagram posts and videos carried over from the static site. Upload <code>wordpress/media/</code> to the Media Library first, or the items will be created without photos.</p>';
	echo '<p>Running it more than once is safe: existing items are updated, not duplicated.</p>';
	echo '<form method="post">';
	wp_nonce_field( 'ap_import' );
	echo '<p><button class="button button-primary" name="ap_import" value="1">Import content</button></p>';
	echo '</form></div>';
}

/**
 * Find an attachment by its filename.
 *
 * Uploads are flat — "Organize my uploads into month- and year-based folders"
 * is off — so the URL is predictable and attachment_url_to_postid can resolve
 * it directly.
 */
function ap_attachment_by_filename( string $filename ) : int {
	$filename = basename( $filename );
	$uploads  = wp_get_upload_dir();
	$id       = attachment_url_to_postid( trailingslashit( $uploads['baseurl'] ) . $filename );

	if ( $id ) {
		return $id;
	}

	// WordPress renames on collision (foo.jpg -> foo-1.jpg) and strips some
	// characters, so fall back to a meta lookup on the stored file path.
	$found = get_posts( [
		'post_type'   => 'attachment',
		'post_status' => 'inherit',
		'numberposts' => 1,
		'fields'      => 'ids',
		'meta_query'  => [ [
			'key'     => '_wp_attached_file',
			'value'   => $filename,
			'compare' => 'LIKE',
		] ],
	] );

	return $found ? (int) $found[0] : 0;
}

/**
 * Find or create the post that carries this source key, so a second run
 * updates instead of duplicating.
 */
function ap_upsert( string $type, string $source_key, string $title, int $order ) : int {
	$existing = get_posts( [
		'post_type'   => $type,
		'post_status' => 'any',
		'numberposts' => 1,
		'fields'      => 'ids',
		'meta_query'  => [ [ 'key' => '_ap_source', 'value' => $source_key ] ],
	] );

	$args = [
		'post_type'   => $type,
		'post_status' => 'publish',
		'post_title'  => $title,
		'menu_order'  => $order,
	];

	if ( $existing ) {
		$args['ID'] = (int) $existing[0];
		wp_update_post( $args );
		return (int) $existing[0];
	}

	$id = wp_insert_post( $args, true );
	if ( is_wp_error( $id ) ) {
		return 0;
	}
	update_post_meta( $id, '_ap_source', $source_key );
	return (int) $id;
}

function ap_run_import() : array {
	$counts = [
		'ap_gallery'    => 0,
		'ap_instagram'  => 0,
		'ap_video'      => 0,
		'missing'       => 0,
		'missing_files' => [],
	];

	$read = function ( string $name ) {
		$file = AP_DIR . 'data/' . $name . '.json';
		if ( ! file_exists( $file ) ) {
			return [];
		}
		$data = json_decode( (string) file_get_contents( $file ), true );
		return is_array( $data ) ? $data : [];
	};

	$attach = function ( int $post_id, string $file ) use ( &$counts ) : void {
		$att = ap_attachment_by_filename( $file );
		if ( $att ) {
			set_post_thumbnail( $post_id, $att );
		} else {
			$counts['missing']++;
			$counts['missing_files'][] = basename( $file );
		}
	};

	// --- Gallery ---------------------------------------------------------
	foreach ( $read( 'gallery' ) as $i => $item ) {
		$src = (string) ( $item['src'] ?? '' );
		if ( '' === $src ) {
			continue;
		}
		$id = ap_upsert( 'ap_gallery', $src, (string) ( $item['title'] ?? '' ), $i );
		if ( ! $id ) {
			continue;
		}
		update_post_meta( $id, '_ap_alt', sanitize_text_field( (string) ( $item['alt'] ?? '' ) ) );

		// "custom-aquariums commercial" is two space-separated category slugs.
		$cats = array_filter( explode( ' ', (string) ( $item['category'] ?? '' ) ) );
		if ( $cats ) {
			wp_set_object_terms( $id, $cats, 'ap_gallery_cat' );
		}

		$attach( $id, $src );
		$counts['ap_gallery']++;
	}

	// --- Instagram -------------------------------------------------------
	foreach ( $read( 'instagram' ) as $i => $item ) {
		$link = (string) ( $item['link'] ?? '' );
		if ( '' === $link ) {
			continue;
		}
		$caption = (string) ( $item['caption'] ?? '' );
		$id      = ap_upsert( 'ap_instagram', $link, $caption, $i );
		if ( ! $id ) {
			continue;
		}
		update_post_meta( $id, '_ap_link', esc_url_raw( $link ) );
		update_post_meta( $id, '_ap_caption', sanitize_text_field( $caption ) );
		$attach( $id, (string) ( $item['image'] ?? '' ) );
		$counts['ap_instagram']++;
	}

	// --- Videos ----------------------------------------------------------
	foreach ( $read( 'videos' ) as $i => $item ) {
		$yt = (string) ( $item['youtube'] ?? '' );
		if ( '' === $yt ) {
			continue;
		}
		$id = ap_upsert( 'ap_video', 'yt:' . $yt, (string) ( $item['title'] ?? '' ), $i );
		if ( ! $id ) {
			continue;
		}
		update_post_meta( $id, '_ap_youtube', sanitize_text_field( $yt ) );
		update_post_meta( $id, '_ap_external', ! empty( $item['external'] ) ? '1' : '' );
		update_post_meta( $id, '_ap_featured', ! empty( $item['featured'] ) ? '1' : '' );
		$attach( $id, (string) ( $item['image'] ?? '' ) );
		$counts['ap_video']++;
	}

	return $counts;
}
