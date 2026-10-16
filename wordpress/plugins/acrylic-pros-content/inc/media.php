<?php
/**
 * Register files that are already sitting in wp-content/uploads as real
 * Media Library attachments.
 *
 * Why this exists: the build references 458 files. Uploading those through
 * Media → Add New means fighting PHP's max_file_uploads, which on shared
 * hosting is usually 20 per batch — roughly 23 drag-and-drops, each one a
 * chance to miss a file and not notice until a page renders with a hole in it.
 *
 * The faster route is the host's own File Manager: upload one zip of
 * wordpress/media/ into wp-content/uploads/, extract it flat, then press the
 * button here.
 *
 * Note the two different needs, because they are easy to conflate:
 *
 *   - The page markup references /wp-content/uploads/<file> as plain URLs.
 *     Those work the moment the FILE exists. No attachment post needed.
 *   - The gallery, Instagram and video importers, and WooCommerce product
 *     images, need real ATTACHMENTS — they match by filename and set a
 *     featured image. That is what this screen creates.
 *
 * So after extracting the zip the site already looks right; this step is what
 * makes the content importers work.
 */

defined( 'ABSPATH' ) || exit;

/** How many files to process per click. Metadata generation resizes images,
 *  which is the slow part — small batches keep this under any host's timeout. */
const AP_MEDIA_BATCH = 150;

add_action( 'admin_menu', function () {
	add_management_page(
		'Acrylic Pros media',
		'Acrylic Pros media',
		'manage_options',
		'ap-media',
		'ap_media_page'
	);
} );

/**
 * Files sitting in the uploads root that WordPress does not know about.
 *
 * Non-recursive on purpose: the build expects flat uploads, so anything in a
 * dated subfolder is not what these pages reference.
 */
function ap_unregistered_files() : array {
	$dir = wp_get_upload_dir();
	$base = trailingslashit( $dir['basedir'] );

	$allowed = [ 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp4', 'webm' ];
	$out = [];

	// Every registered filename in one query. Asking per file meant thousands
	// of queries per page load with a catalogue this size, which is half of
	// why registering timed out (client, 23 Sept).
	global $wpdb;
	$known = [];
	foreach ( (array) $wpdb->get_col(
		"SELECT meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_wp_attached_file'"
	) as $file ) {
		// The full stored path, not the bare name: on an existing site an old
		// upload in a dated folder (2025/10/x.jpg) can share a name with one
		// of ours in the root, and must not hide it.
		$known[ $file ] = true;
	}

	foreach ( (array) glob( $base . '*.*' ) as $path ) {
		if ( ! is_file( $path ) ) {
			continue;
		}
		$name = basename( $path );
		$ext  = strtolower( pathinfo( $name, PATHINFO_EXTENSION ) );
		if ( ! in_array( $ext, $allowed, true ) ) {
			continue;
		}
		// A size WordPress generated from another image (…-150x150.png, like
		// the WooCommerce placeholders): not a file of its own. None of the
		// build's names end like this.
		if ( preg_match( '/-\d+x\d+\.[a-z0-9]+$/i', $name ) ) {
			continue;
		}
		// WordPress stores the path relative to the uploads dir, so for a flat
		// upload that is just the filename.
		if ( isset( $known[ $name ] ) ) {
			continue;
		}
		$out[] = $name;
	}

	sort( $out );
	return $out;
}

/**
 * Folders inside uploads/ that belong to WordPress or another plugin and must
 * never be touched. Anything else holding our file types is almost certainly a
 * zip that extracted one level too deep.
 */
function ap_reserved_upload_dirs() : array {
	return [
		'elementor', 'wpcf7_uploads', 'woocommerce_uploads', 'wc-logs', 'sites',
		// Plugins on the client's existing site (13 Oct): their own caches,
		// never ours to move.
		'sb-instagram-feed-images', 'spotlight-insta', 'wpforms', 'cfdb7_uploads',
		'ai1wm-backups', 'easy-invoice', 'yith-wcaj', 'cache', 'wp-mail-smtp',
	];
}

/**
 * Files only this build ships. A folder counts as "our media, extracted one
 * level too deep" only if it holds at least one of these -- a plugin's own
 * folder of images never does.
 */
function ap_media_signature_files() : array {
	return [ 'hero-poster-desktop-1280.webp', 'favicon-fin.png', 'logo-2026-800.webp', 'scratch-overview-smooth.mp4' ];
}

/**
 * Find our files sitting in a subfolder of uploads/ instead of in uploads/.
 *
 * Most file managers extract a zip into a folder named after the zip, which
 * puts everything one directory too deep and makes every path in the build
 * wrong by exactly that one segment.
 *
 * Returns [ subfolder => count ].
 */
function ap_misplaced_uploads() : array {
	$base = trailingslashit( wp_get_upload_dir()['basedir'] );
	$out  = [];

	foreach ( (array) glob( $base . '*', GLOB_ONLYDIR ) as $path ) {
		$name = basename( $path );

		// Skip WordPress's own year folders and other plugins' folders.
		if ( preg_match( '/^\d{4}$/', $name ) ) {
			continue;
		}
		if ( in_array( $name, ap_reserved_upload_dirs(), true ) ) {
			continue;
		}

		$files = ap_media_files_in( $path );
		// Lots of images is not enough: on an existing site plugins keep
		// image folders here too (Smash Balloon, Spotlight). Only a folder
		// holding our own files is a mis-extracted zip.
		if ( count( $files ) > 5 && array_intersect( ap_media_signature_files(), $files ) ) {
			$out[ $name ] = count( $files );
		}
	}

	return $out;
}

/** Our file types directly inside a directory, non-recursive. */
function ap_media_files_in( string $dir ) : array {
	$allowed = [ 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp4', 'webm' ];
	$out     = [];

	foreach ( (array) glob( trailingslashit( $dir ) . '*.*' ) as $path ) {
		if ( ! is_file( $path ) ) {
			continue;
		}
		$ext = strtolower( pathinfo( $path, PATHINFO_EXTENSION ) );
		if ( in_array( $ext, $allowed, true ) ) {
			$out[] = basename( $path );
		}
	}

	return $out;
}

/**
 * Move files up out of a subfolder into the uploads root.
 *
 * rename() on the same filesystem, so this is a directory-entry change rather
 * than a copy — 458 files is effectively instant and uses no extra disk.
 * A name that already exists at the root is left alone rather than overwritten.
 */
function ap_move_uploads_up( string $subfolder ) : array {
	$base = trailingslashit( wp_get_upload_dir()['basedir'] );
	$sub  = basename( $subfolder );          // no traversal
	$from = $base . $sub . '/';

	if ( ! is_dir( $from ) || in_array( $sub, ap_reserved_upload_dirs(), true ) ) {
		return [ 'moved' => 0, 'skipped' => 0, 'errors' => [ 'Refused to touch ' . $sub ] ];
	}

	$moved = 0;
	$skipped = 0;
	$errors = [];

	foreach ( ap_media_files_in( $from ) as $name ) {
		$target = $base . $name;
		if ( file_exists( $target ) ) {
			$skipped++;
			continue;
		}
		if ( @rename( $from . $name, $target ) ) {
			$moved++;
		} else {
			$errors[] = $name;
		}
	}

	// Tidy up, but only if it is genuinely empty.
	if ( ! ap_media_files_in( $from ) ) {
		@rmdir( $from );
	}

	return [ 'moved' => $moved, 'skipped' => $skipped, 'errors' => $errors ];
}

/**
 * Zips sitting in the uploads root, waiting to be unpacked.
 *
 * For hosts whose file manager uploads but cannot extract (GoDaddy's File
 * Browser, client, 13 Oct): upload wordpress/media-parts/*.zip into uploads,
 * then this unpacks them on the server.
 */
function ap_media_zips() : array {
	$base = trailingslashit( wp_get_upload_dir()['basedir'] );
	$zips = glob( $base . '*.zip' );
	return $zips ? array_map( 'basename', $zips ) : [];
}

/**
 * Unpack one zip into the uploads root.
 *
 * Only plain image and video files at the top of the zip are written: an
 * entry with a folder path, "..", or any other extension (a .php, say) is
 * refused, so a zip can never place a script or escape the uploads folder.
 * Existing files are never overwritten. The zip is deleted once everything in
 * it is accounted for, to keep the hosting plan's storage down.
 */
function ap_extract_media_zip( string $name ) : array {
	$out  = [ 'written' => 0, 'existed' => 0, 'refused' => [], 'error' => '', 'deleted' => false ];
	$base = trailingslashit( wp_get_upload_dir()['basedir'] );
	$name = basename( $name );
	$path = $base . $name;

	if ( '.zip' !== strtolower( substr( $name, -4 ) ) || ! is_file( $path ) ) {
		$out['error'] = 'Not found.';
		return $out;
	}
	if ( ! class_exists( 'ZipArchive' ) ) {
		$out['error'] = 'This server has no ZipArchive (PHP zip extension). Upload the files by SFTP instead.';
		return $out;
	}

	$allowed = [ 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp4', 'webm' ];
	$zip     = new ZipArchive();
	if ( true !== $zip->open( $path ) ) {
		$out['error'] = 'Could not open the zip. Was the upload complete?';
		return $out;
	}

	if ( function_exists( 'set_time_limit' ) ) {
		@set_time_limit( 300 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
	}

	for ( $i = 0; $i < $zip->numFiles; $i++ ) {
		$entry = (string) $zip->getNameIndex( $i );
		$ext   = strtolower( pathinfo( $entry, PATHINFO_EXTENSION ) );
		// A plain name of letters, digits, dot, dash and underscore. Not
		// sanitize_file_name(): it strips a leading "-" or "_", and the YouTube
		// thumbnails are named after their video IDs (-Zy5pNRdqUo.jpg).
		if ( ! preg_match( '/^[A-Za-z0-9_\-][A-Za-z0-9._\-]*$/', $entry ) || false !== strpos( $entry, '..' )
			|| ! in_array( $ext, $allowed, true ) ) {
			$out['refused'][] = $entry;
			continue;
		}
		$target = $base . $entry;
		if ( file_exists( $target ) ) {
			$out['existed']++;
			continue;
		}
		$in = $zip->getStream( $entry );
		$fh = $in ? fopen( $target, 'wb' ) : false;
		if ( ! $in || ! $fh ) {
			$out['refused'][] = $entry . ' (could not write)';
			continue;
		}
		stream_copy_to_stream( $in, $fh );
		fclose( $fh );
		fclose( $in );
		$out['written']++;
	}
	$zip->close();

	if ( ! $out['refused'] ) {
		// Uploaded through Media -> Add New, the zip is also a Media Library
		// item; remove that with it, or the library keeps an empty entry.
		global $wpdb;
		$attachment = (int) $wpdb->get_var( $wpdb->prepare(
			"SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_wp_attached_file' AND meta_value = %s LIMIT 1",
			$name
		) );
		if ( $attachment ) {
			wp_delete_attachment( $attachment, true ); // deletes the file too
		}
		$out['deleted'] = ! file_exists( $path ) || @unlink( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
	}
	return $out;
}

function ap_media_page() : void {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'You do not have permission to do this.' );
	}

	$dir = wp_get_upload_dir();

	echo '<div class="wrap"><h1>Acrylic Pros media</h1>';

	// --- uploaded zips: unpack on the server -------------------------------
	if ( isset( $_POST['ap_unzip'] ) && check_admin_referer( 'ap_media' ) ) {
		foreach ( ap_media_zips() as $zip_name ) {
			$x = ap_extract_media_zip( $zip_name );
			if ( $x['error'] ) {
				printf( '<div class="notice notice-error"><p><strong>%s:</strong> %s</p></div>', esc_html( $zip_name ), esc_html( $x['error'] ) );
				continue;
			}
			printf(
				'<div class="notice notice-%s"><p><strong>%s:</strong> %d file(s) extracted%s%s%s</p></div>',
				$x['refused'] ? 'warning' : 'success',
				esc_html( $zip_name ),
				(int) $x['written'],
				$x['existed'] ? ', ' . (int) $x['existed'] . ' already there (left as they were)' : '',
				$x['refused'] ? '. Skipped (not a plain image/video file): ' . esc_html( implode( ', ', array_slice( $x['refused'], 0, 5 ) ) ) : '',
				$x['deleted'] ? '. Zip deleted.' : ''
			);
		}
	}

	$zips = ap_media_zips();
	if ( $zips ) {
		echo '<div class="notice notice-info"><p><strong>Zip files found in uploads:</strong> <code>'
			. esc_html( implode( '</code>, <code>', $zips ) ) . '</code></p>';
		echo '<form method="post">';
		wp_nonce_field( 'ap_media' );
		printf(
			'<p><button class="button button-primary button-hero" name="ap_unzip" value="1">Extract %d zip file(s) here</button></p>',
			count( $zips )
		);
		echo '<p class="description">Unpacks them on the server, flat into uploads, then deletes each zip. Only image and video files are written; nothing is overwritten.</p>';
		echo '</form></div>';
	}

	if ( isset( $_POST['ap_move'] ) && check_admin_referer( 'ap_media' ) ) {
		$sub = sanitize_file_name( wp_unslash( $_POST['ap_move'] ) );
		$m   = ap_move_uploads_up( $sub );
		printf(
			'<div class="notice notice-success"><p>Moved %d file(s) out of <code>%s/</code> into the uploads root.%s</p></div>',
			(int) $m['moved'],
			esc_html( $sub ),
			$m['skipped'] ? ' ' . (int) $m['skipped'] . ' already existed and were left alone.' : ''
		);
		if ( $m['errors'] ) {
			printf(
				'<div class="notice notice-error"><p>Could not move: %s</p></div>',
				esc_html( implode( ', ', array_slice( $m['errors'], 0, 6 ) ) )
			);
		}
	}

	// Files one level too deep — the usual result of extracting the zip.
	$misplaced = ap_misplaced_uploads();
	if ( $misplaced ) {
		echo '<div class="notice notice-warning"><p><strong>Files are in the wrong folder.</strong> The build expects them directly in <code>'
			. esc_html( $dir['basedir'] ) . '</code>, but they are one level deeper. Most file managers extract a zip into a folder named after it.</p></div>';

		foreach ( $misplaced as $sub => $count ) {
			echo '<form method="post" style="margin:0 0 1em">';
			wp_nonce_field( 'ap_media' );
			printf(
				'<p><button class="button button-primary" name="ap_move" value="%s">Move %d file(s) from %s/ into uploads/</button></p>',
				esc_attr( $sub ), (int) $count, esc_html( $sub )
			);
			echo '</form>';
		}
	}

	if ( isset( $_POST['ap_media'] ) && check_admin_referer( 'ap_media' ) ) {
		$r    = ap_register_media( AP_MEDIA_BATCH, ! empty( $_POST['ap_thumbs'] ) );
		$auto = ! empty( $_POST['ap_auto'] );

		printf(
			'<div class="notice notice-success"><p>Registered %d file(s). %d still to go.</p></div>',
			(int) $r['done'], (int) $r['remaining']
		);
		if ( $r['errors'] ) {
			printf(
				'<div class="notice notice-warning"><p>%s</p></div>',
				esc_html( implode( ' · ', array_slice( $r['errors'], 0, 5 ) ) )
			);
		}

		// Keep going on its own. One batch per request keeps each one well
		// inside the host's timeout; this just saves pressing the button
		// twelve times and scrolling back up after each one.
		//
		// It stops if a batch registered nothing, so a file that cannot be
		// processed makes this end rather than reload for ever.
		if ( $auto && $r['remaining'] > 0 && $r['done'] > 0 ) {
			echo '<div class="notice notice-info"><p><strong>Continuing automatically…</strong> '
				. (int) $r['remaining'] . ' left. Leave this tab open, or press Stop in the browser to pause.</p></div>';
			echo '<form method="post" id="ap-auto-form">';
			wp_nonce_field( 'ap_media' );
			echo '<input type="hidden" name="ap_media" value="1">';
			echo '<input type="hidden" name="ap_auto" value="1">';
			if ( ! empty( $_POST['ap_thumbs'] ) ) {
				echo '<input type="hidden" name="ap_thumbs" value="1">';
			}
			echo '</form>';
			echo '<script>setTimeout(function(){document.getElementById("ap-auto-form").submit();}, 400);</script>';
		} elseif ( $auto && $r['remaining'] > 0 ) {
			echo '<div class="notice notice-error"><p>Stopped: that batch registered nothing, so continuing would loop. See the error above.</p></div>';
		}
	}

	$pending = ap_unregistered_files();

	echo '<h2>How to get the files here</h2><ol>';
	echo '<li><strong>Settings → Media → untick “Organize my uploads into month- and year-based folders”.</strong> Do this first; the build expects flat paths.</li>';
	echo '<li>Upload the zips from <code>wordpress/media-parts/</code> (each under 100 MB) into <code>' . esc_html( $dir['basedir'] ) . '</code> with your host’s file manager.</li>';
	echo '<li>If the file manager can extract, extract them there. If it cannot (GoDaddy’s File Browser), come back here and press <strong>Extract</strong> — it appears at the top once the zips are uploaded.</li>';
	echo '<li>Come back and press the button below until it reports nothing left.</li>';
	echo '</ol>';

	echo '<p class="description">Extracting the zip is already enough for every image on the site to load, because the pages reference these files by URL. This button additionally registers them in the Media Library, which is what the gallery, Instagram, video and product importers need.</p>';

	printf(
		'<p><strong>Files in the uploads root not yet in the Media Library: %d</strong></p>',
		count( $pending )
	);

	if ( $pending ) {
		echo '<p class="description">Next up: <code>'
			. esc_html( implode( ', ', array_slice( $pending, 0, 8 ) ) )
			. ( count( $pending ) > 8 ? ', …' : '' ) . '</code></p>';

		echo '<form method="post">';
		wp_nonce_field( 'ap_media' );
		echo '<input type="hidden" name="ap_media" value="1">';
		printf(
			'<p><button class="button button-primary button-hero" name="ap_auto" value="1">Register all %d — keeps going on its own</button>'
			. ' <button class="button button-hero" type="submit">Just the next %d</button></p>',
			count( $pending ), AP_MEDIA_BATCH
		);
		echo '<p class="description">Files are processed ' . AP_MEDIA_BATCH
			. ' at a time so image resizing cannot hit the host\'s timeout. The first button reloads itself until it is done — leave the tab open.</p>';
		echo '</form>';
	} else {
		echo '<p>Nothing pending. If the count is 0 and you have not uploaded anything yet, the files are not in <code>' . esc_html( $dir['basedir'] ) . '</code> — check they were extracted flat, not into a subfolder.</p>';
	}

	echo '</div>';
}

/**
 * Create attachment posts for up to $limit unregistered files.
 *
 * No thumbnails by default. WordPress would rebuild every registered size for
 * each file -- with WooCommerce installed that is eight or more resizes per
 * image -- and on shared hosting a batch of those runs past nginx's 60s and
 * comes back as a 504 (client, 23 Sept). Nothing here needs them: the pages
 * reference the original files by URL, and WordPress falls back to the full
 * size wherever a thumbnail is missing. Pass $thumbs to generate them anyway.
 *
 * The batch also stops on a time budget, so a slow host cannot time a request
 * out however big the files are.
 */
function ap_register_media( int $limit, bool $thumbs = false, float $budget = 15.0 ) : array {
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$dir  = wp_get_upload_dir();
	$base = trailingslashit( $dir['basedir'] );

	$pending = ap_unregistered_files();
	$batch   = array_slice( $pending, 0, $limit );

	$done    = 0;
	$errors  = [];
	$started = microtime( true );

	foreach ( $batch as $name ) {
		$path = $base . $name;
		$type = wp_check_filetype( $name );

		if ( empty( $type['type'] ) ) {
			$errors[] = "$name: unknown file type";
			continue;
		}

		$id = wp_insert_attachment( [
			'post_mime_type' => $type['type'],
			'post_title'     => sanitize_text_field(
				pathinfo( $name, PATHINFO_FILENAME ) ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		], $path );

		if ( is_wp_error( $id ) || ! $id ) {
			$errors[] = "$name: could not create attachment";
			continue;
		}

		// Videos have no metadata worth generating, and attempting it on a
		// large file is how this times out.
		if ( 0 === strpos( $type['type'], 'image/' ) ) {
			if ( $thumbs ) {
				$meta = wp_generate_attachment_metadata( $id, $path );
			} else {
				// Just the dimensions: enough for the Media Library, the
				// importers and WooCommerce, with no resizing at all.
				$size = @getimagesize( $path );
				$meta = [
					'file'       => $name,
					'width'      => $size ? (int) $size[0] : 0,
					'height'     => $size ? (int) $size[1] : 0,
					'sizes'      => [],
					'image_meta' => [],
				];
			}
			if ( $meta ) {
				wp_update_attachment_metadata( $id, $meta );
			}
		} else {
			update_post_meta( $id, '_wp_attached_file', $name );
		}

		$done++;

		if ( microtime( true ) - $started > $budget ) {
			break; // hand the rest to the next request
		}
	}

	return [
		'done'      => $done,
		'remaining' => max( 0, count( $pending ) - $done ),
		'errors'    => $errors,
	];
}
