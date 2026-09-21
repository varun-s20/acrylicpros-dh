<?php
/**
 * Build the site from wp-admin: Tools → Acrylic Pros setup.
 *
 * Replaces README steps 5 and 6 — the Theme Builder header and footer, and 25
 * pages each needing a slug, a page layout, a hidden title, a container and an
 * HTML widget. That is several hundred clicks done by hand, and every one of
 * them is a chance to paste the wrong body into the wrong page.
 *
 * There is no WP-CLI on this host, so this runs inside WordPress instead.
 *
 * It is safe to run repeatedly. Everything it creates is tagged with the
 * _ap_managed meta key and matched on that plus the slug, so a second run
 * updates in place rather than creating a second copy. That also means a page
 * whose body changed in the build gets refreshed by re-running this, which is
 * how a design change reaches the install.
 *
 * What it deliberately does NOT do:
 *   - touch anything without _ap_managed, so a page the owner made by hand is
 *     never overwritten
 *   - delete anything, ever
 *   - create the 404 template, which lives in Theme Builder under a different
 *     template type and is a single manual step
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_menu', function () {
	add_management_page(
		'Acrylic Pros setup',
		'Acrylic Pros setup',
		'manage_options',
		'ap-setup',
		'ap_setup_page'
	);
} );

/**
 * Elementor stores a page as a JSON tree in _elementor_data. This builds the
 * smallest tree that renders our markup: one full-width container with zero
 * padding, holding one HTML widget.
 *
 * The container's tag is `div`, not `main` — every page body already opens its
 * own <main id="main">, and nesting one inside another is invalid.
 */
function ap_elementor_tree( string $html ) : array {
	return [
		[
			'id'       => substr( md5( 'container' . $html ), 0, 7 ),
			'elType'   => 'container',
			'settings' => [
				'content_width'   => 'full',
				'html_tag'        => 'div',
				'padding'         => [
					'unit' => 'px', 'top' => '0', 'right' => '0',
					'bottom' => '0', 'left' => '0', 'isLinked' => true,
				],
				'margin'          => [
					'unit' => 'px', 'top' => '0', 'right' => '0',
					'bottom' => '0', 'left' => '0', 'isLinked' => true,
				],
				'flex_gap'        => [
					'unit' => 'px', 'size' => 0, 'column' => '0', 'row' => '0',
				],
			],
			'elements' => [
				[
					'id'         => substr( md5( 'widget' . $html ), 0, 7 ),
					'elType'     => 'widget',
					'widgetType' => 'html',
					'settings'   => [ 'html' => $html ],
					'elements'   => [],
				],
			],
		],
	];
}

/**
 * Write the Elementor meta onto a post.
 *
 * wp_slash before saving: WordPress strips one level of slashes on the way
 * into the database, and Elementor's own save path slashes first for exactly
 * this reason. Skip it and every backslash in the markup is eaten.
 */
function ap_write_elementor( int $post_id, string $html, string $template_type = 'wp-page' ) : void {
	update_post_meta( $post_id, '_elementor_data',
		wp_slash( wp_json_encode( ap_elementor_tree( $html ) ) ) );
	update_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
	update_post_meta( $post_id, '_elementor_template_type', $template_type );

	if ( defined( 'ELEMENTOR_VERSION' ) ) {
		update_post_meta( $post_id, '_elementor_version', ELEMENTOR_VERSION );
	}
}

/**
 * Find a post this plugin previously created, by slug and post type.
 * Never matches a post the owner made themselves.
 */
function ap_find_managed( string $slug, string $post_type ) : int {
	$found = get_posts( [
		'post_type'        => $post_type,
		'post_status'      => 'any',
		'numberposts'      => 1,
		'fields'           => 'ids',
		'name'             => $slug,
		'suppress_filters' => false,
		'meta_query'       => [ [ 'key' => '_ap_managed', 'compare' => 'EXISTS' ] ],
	] );
	return $found ? (int) $found[0] : 0;
}

function ap_setup_page() : void {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'You do not have permission to do this.' );
	}

	echo '<div class="wrap"><h1>Acrylic Pros setup</h1>';

	if ( ! did_action( 'elementor/loaded' ) ) {
		echo '<div class="notice notice-error"><p><strong>Elementor is not active.</strong> Activate Elementor (and Elementor Pro, for the header and footer templates) before running this.</p></div></div>';
		return;
	}

	if ( isset( $_POST['ap_setup'] ) && check_admin_referer( 'ap_setup' ) ) {
		$r = ap_run_setup();

		echo '<div class="notice notice-success"><p>'
			. sprintf(
				'Pages: %d created, %d updated. Templates: %s.',
				(int) $r['created'], (int) $r['updated'],
				esc_html( $r['templates'] )
			) . '</p></div>';

		foreach ( $r['notes'] as $note ) {
			printf( '<div class="notice notice-warning"><p>%s</p></div>', esc_html( $note ) );
		}

		echo '<p><strong>Now do these by hand — they are the only steps left:</strong></p><ol>'
			. '<li>Templates → Theme Builder → check the header and footer both show <em>Entire Site</em> under Display Conditions.</li>'
			. '<li>Theme Builder → Add New → <strong>404 Page</strong>, one HTML widget, paste <code>wordpress/pages/404.html</code> if you want the designed 404.</li>'
			. '<li>Tools → <strong>Acrylic Pros import</strong> for the gallery, Instagram and videos.</li>'
			. '<li>WooCommerce → Products → Import for <code>products.csv</code>.</li>'
			. '</ol>';
	}

	// --- diagnostics -----------------------------------------------------
	echo '<h2>Before you build</h2>';
	echo '<table class="widefat striped" style="max-width:62em"><tbody>';
	foreach ( ap_diagnostics() as [ $label, $value, $good, $hint ] ) {
		printf(
			'<tr><td style="width:14em"><strong>%s</strong></td><td>%s %s%s</td></tr>',
			esc_html( $label ),
			$good ? '<span style="color:#1a7f37">&#10003;</span>' : '<span style="color:#b32d2e">&#10007;</span>',
			esc_html( $value ),
			$hint ? '<br><span class="description">' . esc_html( $hint ) . '</span>' : ''
		);
	}
	echo '</tbody></table>';

	$manifest = ap_setup_manifest();

	echo '<h2>Build</h2>';
	echo '<p>Creates the Theme Builder header and footer, and all '
		. count( $manifest ) . ' pages — each with its slug, Elementor Full Width layout, hidden title and its body already in an HTML widget. Sets the front page too.</p>';
	echo '<p><strong>Safe to run more than once.</strong> It only ever touches what it created itself, matched on slug; anything you made by hand is left alone. Re-run it after a new build to push updated page bodies.</p>';
	echo '<p>It does not delete anything.</p>';

	echo '<form method="post">';
	wp_nonce_field( 'ap_setup' );
	echo '<p><button class="button button-primary button-hero" name="ap_setup" value="1">Build the site</button></p>';
	echo '</form></div>';
}

function ap_setup_manifest() : array {
	$file = AP_DIR . 'data/pages.json';
	if ( ! file_exists( $file ) ) {
		return [];
	}
	$data = json_decode( (string) file_get_contents( $file ), true );
	return is_array( $data ) ? $data : [];
}

function ap_run_setup() : array {
	$out = [ 'created' => 0, 'updated' => 0, 'templates' => '', 'notes' => [] ];

	// --- pages -----------------------------------------------------------
	$front_id = 0;

	foreach ( ap_setup_manifest() as $item ) {
		$slug  = sanitize_title( (string) ( $item['slug'] ?? '' ) );
		$title = (string) ( $item['title'] ?? '' );
		if ( '' === $slug ) {
			continue;
		}

		$body = AP_DIR . 'data/pages/' . $slug . '.html';
		if ( ! file_exists( $body ) ) {
			$out['notes'][] = "No body file for '$slug' — page skipped.";
			continue;
		}
		$html = (string) file_get_contents( $body );

		// The front page keeps the slug "home"; "index" is not a usable
		// WordPress slug and would collide with the site root.
		$wp_slug = ( 'index' === $slug ) ? 'home' : $slug;

		$id = ap_find_managed( $wp_slug, 'page' );

		$args = [
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => $title,
			'post_name'    => $wp_slug,
			'post_content' => '',
		];

		if ( $id ) {
			$args['ID'] = $id;
			wp_update_post( $args );
			$out['updated']++;
		} else {
			// An unmanaged page may already own this slug — WordPress would
			// silently give ours "-2". Say so rather than leaving a mystery.
			$existing = get_page_by_path( $wp_slug );
			if ( $existing ) {
				$out['notes'][] = "A page already exists at '$wp_slug' that this tool did not create. Created a second one — delete whichever you do not want.";
			}
			$id = wp_insert_post( $args, true );
			if ( is_wp_error( $id ) ) {
				$out['notes'][] = "Could not create '$slug': " . $id->get_error_message();
				continue;
			}
			$out['created']++;
		}

		update_post_meta( $id, '_ap_managed', '1' );
		update_post_meta( $id, '_wp_page_template', 'elementor_header_footer' );

		// Elementor's own per-page settings. hide_title stops the theme
		// printing its <h1> above our markup, which would give every page two.
		update_post_meta( $id, '_elementor_page_settings',
			[ 'hide_title' => 'yes' ] );

		ap_write_elementor( (int) $id, $html );

		if ( 'index' === $slug ) {
			$front_id = (int) $id;
		}
	}

	// --- front page ------------------------------------------------------
	if ( $front_id ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $front_id );
	}

	// --- Theme Builder header and footer ---------------------------------
	$out['templates'] = ap_build_templates( $out['notes'] );

	// --- housekeeping ----------------------------------------------------
	// Elementor caches the CSS it generates per post; without this the new
	// pages render with no Elementor CSS at all until something else clears it.
	if ( class_exists( '\Elementor\Plugin' )
		&& isset( \Elementor\Plugin::$instance->files_manager ) ) {
		\Elementor\Plugin::$instance->files_manager->clear_cache();
	}

	// Pretty permalinks need the rules rebuilt now that the pages exist.
	flush_rewrite_rules();

	return $out;
}

/**
 * The Theme Builder header and footer.
 *
 * These are `elementor_library` posts whose template type is header/footer.
 * Display conditions are Pro-only and live in _elementor_conditions; setting
 * `include/general` is what "Entire Site" writes.
 */
function ap_build_templates( array &$notes ) : string {
	$made = [];

	$templates = [
		'header' => [ 'Acrylic Pros header', 'chrome/header.html' ],
		'footer' => [ 'Acrylic Pros footer', 'chrome/chat.html' ],
	];

	foreach ( $templates as $type => [ $title, $rel ] ) {
		$file = AP_DIR . 'data/' . $rel;
		if ( ! file_exists( $file ) ) {
			$notes[] = "Missing $rel — $type template not created.";
			continue;
		}

		$slug = 'ap-' . $type;
		$id   = ap_find_managed( $slug, 'elementor_library' );

		$args = [
			'post_type'   => 'elementor_library',
			'post_status' => 'publish',
			'post_title'  => $title,
			'post_name'   => $slug,
		];

		if ( $id ) {
			$args['ID'] = $id;
			wp_update_post( $args );
		} else {
			$id = wp_insert_post( $args, true );
			if ( is_wp_error( $id ) ) {
				$notes[] = "Could not create the $type template: " . $id->get_error_message();
				continue;
			}
		}

		update_post_meta( $id, '_ap_managed', '1' );
		ap_write_elementor( (int) $id, (string) file_get_contents( $file ), $type );

		// Elementor also keys templates by a taxonomy term.
		wp_set_object_terms( (int) $id, $type, 'elementor_library_type' );

		// "Entire Site". This is Pro-only; on free Elementor the meta is
		// simply ignored and the template never displays.
		update_post_meta( $id, '_elementor_conditions', [ 'include/general' ] );

		$made[] = $type;
	}

	// Elementor Pro does not read _elementor_conditions on every request — it
	// keeps a cache of which template answers which condition. Writing the meta
	// without invalidating that cache leaves the templates published, correct,
	// and invisible, with the theme printing its own header instead. That is
	// exactly what "the site title says WordPress at the top" looks like.
	ap_clear_conditions_cache();

	if ( ! $made ) {
		return 'none created';
	}

	return implode( ' and ', $made ) . ' created';
}

/**
 * Invalidate Elementor Pro's theme-builder conditions cache.
 *
 * Wrapped in guards because this reaches into Pro's internals and the class
 * path has moved between versions. Worst case it does nothing and the
 * conditions are re-saved by hand in Theme Builder — which is why the setup
 * screen still tells you to check.
 */
function ap_clear_conditions_cache() : void {
	try {
		if ( class_exists( '\ElementorPro\Modules\ThemeBuilder\Module' ) ) {
			$module = \ElementorPro\Modules\ThemeBuilder\Module::instance();
			if ( method_exists( $module, 'get_conditions_manager' ) ) {
				$manager = $module->get_conditions_manager();
				if ( $manager && method_exists( $manager, 'get_cache' ) ) {
					$cache = $manager->get_cache();
					if ( $cache && method_exists( $cache, 'regenerate' ) ) {
						$cache->regenerate();
						return;
					}
				}
			}
		}
	} catch ( \Throwable $e ) {
		// fall through to the blunt version
	}

	// Blunt fallback: drop the cached option so Pro rebuilds it on next read.
	delete_option( 'elementor_pro_theme_builder_conditions' );
}

/**
 * What the setup screen reports before you press anything.
 *
 * Every one of these has been a real "the whole site is broken" moment, and
 * each has a different cause and a different fix. Showing them together turns
 * that into a thirty-second answer.
 */
function ap_diagnostics() : array {
	$uploads = wp_get_upload_dir();
	$rows    = [];

	$count = (int) ( wp_count_posts( 'attachment' )->inherit ?? 0 );
	$rows[] = [
		'Media Library',
		$count . ' files',
		$count > 100,
		$count > 100 ? '' : 'The build references 458 files. Upload wordpress/media/ before anything else.',
	];

	$rows[] = [
		'Uploads served from',
		$uploads['baseurl'],
		false !== strpos( $uploads['baseurl'], '/wp-content/uploads' ),
		'',
	];

	// The build writes /wp-content/uploads/<file> with no date folder. If
	// WordPress is putting new files in a dated subfolder, every image 404s.
	$dated = ( '' !== (string) $uploads['subdir'] );
	$rows[] = [
		'Month/year upload folders',
		$dated ? 'ON — ' . $uploads['subdir'] : 'off',
		! $dated,
		$dated
			? 'The build expects flat uploads. Untick Settings → Media → "Organize my uploads into month- and year-based folders" BEFORE uploading anything. If files are already uploaded into dated folders, rebuild instead with: python tools/build_wordpress.py --uploads '
				. wp_make_link_relative( $uploads['baseurl'] ) . $uploads['subdir']
			: '',
	];

	// Does a file the build actually references resolve to an attachment?
	$probe = 'hero-poster-desktop-1280.webp';
	$found = function_exists( 'ap_attachment_by_filename' )
		? ap_attachment_by_filename( $probe ) : 0;
	$rows[] = [
		'Sample image resolves',
		$found ? 'yes (attachment ' . $found . ')' : 'NO — ' . $probe . ' not found',
		(bool) $found,
		$found ? '' : 'This one filename is used by the homepage hero. If it is missing, the media upload did not complete.',
	];

	$pro = defined( 'ELEMENTOR_PRO_VERSION' );
	$rows[] = [
		'Elementor Pro',
		$pro ? ELEMENTOR_PRO_VERSION : 'not active',
		$pro,
		$pro ? '' : 'Theme Builder display conditions are Pro-only. Without it the header and footer templates never appear and the theme prints its own header.',
	];

	return $rows;
}
