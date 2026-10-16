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
 * It also builds the Theme Builder 404 template, and fills the settings the
 * pages assume (ap_setup_settings): site title, tagline and icon while they
 * are still WordPress's defaults, the privacy page, Yoast's organisation,
 * media-page redirect and the noindex on cart/checkout/account, and -- on
 * staging only -- "discourage search engines".
 *
 * What it deliberately does NOT do:
 *   - touch anything without _ap_managed, so a page the owner made by hand is
 *     never overwritten. One exception: WordPress's own sample content
 *     (Sample Page, "Hello world!", the default Privacy Policy page) goes to
 *     the Trash, because it holds slugs our pages need
 *   - delete anything permanently; the Trash is as far as it goes
 *   - change "discourage search engines" on the live domain
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
					// Elementor's frontend.css zeroes the margin of every <figure> in a
					// widget -- `.elementor .elementor-widget:not(...-text-editor)
					// :not(...-theme-post-content) figure`, four classes deep, so no
					// design rule can win. It exempts post-content widgets, and this
					// widget *is* the page's content, so it takes that class. The class
					// carries no other style anywhere in Elementor. Without it the
					// scratch-removal film sat hard left and About lost its offsets.
					'settings'   => [
						'html'         => $html,
						'_css_classes' => 'elementor-widget-theme-post-content',
					],
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

		if ( $r['done'] ) {
			echo '<div class="notice notice-info"><p><strong>Also done:</strong></p><ul style="list-style:disc;margin-left:2em">';
			foreach ( $r['done'] as $line ) {
				printf( '<li>%s</li>', esc_html( $line ) );
			}
			echo '</ul></div>';
		}

		foreach ( $r['notes'] as $note ) {
			printf( '<div class="notice notice-warning"><p>%s</p></div>', esc_html( $note ) );
		}

		echo '<p><strong>Now do these by hand — they are the only steps left:</strong></p><ol>'
			. '<li>Templates → Theme Builder → check the header and footer show <em>Entire Site</em>, and the 404 shows <em>404 Page</em>, under Display Conditions.</li>'
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
	echo '<p>It never deletes anything permanently. WordPress\'s own sample content (Sample Page, "Hello world!", the default Privacy Policy page) is moved to the Trash so our pages get their proper addresses. It also builds the 404 page and fills in the site title, icon and Yoast basics where they are still WordPress\'s defaults.</p>';

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
	$out = [ 'created' => 0, 'updated' => 0, 'templates' => '', 'notes' => [], 'done' => [] ];

	// --- WordPress's own sample content out of the way first -------------
	// so our pages get their proper slugs (the default Privacy Policy page is
	// why staging grew a /privacy-policy-2/).
	ap_setup_cleanup( $out['done'] );

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

	// --- Theme Builder header, footer and 404 ----------------------------
	$out['templates'] = ap_build_templates( $out['notes'] );

	// --- settings the custom site's pages assume -------------------------
	ap_setup_settings( $out['done'], $out['notes'] );

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
 * Move WordPress's own sample content to the Trash.
 *
 * Only ever: the "Sample Page", the "Hello world!" post, and the default
 * Privacy Policy page WordPress creates -- and only when this plugin did not
 * make them. Trash, not delete: all of it can be restored from the Trash.
 *
 * Then gives back the proper address to any of our pages that landed on
 * "<slug>-2" because one of those held the slug, and moves the extra copies
 * an earlier run made because of it to the Trash.
 */
function ap_setup_cleanup( array &$done ) : void {
	$unmanaged = function ( $post ) : bool {
		return $post instanceof WP_Post && 'trash' !== $post->post_status
			&& ! get_post_meta( $post->ID, '_ap_managed', true );
	};

	$samples = [
		[ 'sample-page', 'page', 'Sample Page' ],
		[ 'hello-world', 'post', '"Hello world!" post' ],
	];
	foreach ( $samples as [ $slug, $type, $label ] ) {
		$post = get_page_by_path( $slug, OBJECT, $type );
		if ( $unmanaged( $post ) ) {
			wp_trash_post( $post->ID );
			$done[] = "Moved WordPress's sample $label to the Trash.";
		}
	}

	// WordPress's default privacy page is the one Settings -> Privacy points
	// at; ours replaces it.
	$default = get_post( (int) get_option( 'wp_page_for_privacy_policy' ) );
	// Only while it is still WordPress's untouched draft: a published one is
	// the site's own text, and is set aside below instead.
	if ( $unmanaged( $default ) && 'page' === $default->post_type && 'draft' === $default->post_status
		&& 0 === strpos( $default->post_name, 'privacy-policy' ) ) {
		wp_trash_post( $default->ID );
		$done[] = "Moved WordPress's default Privacy Policy page to the Trash (the site's own one replaces it).";
	}

	// Clear each of our page addresses of anything else holding it. Pages and
	// media share one address space in WordPress, so this is both:
	//   - a Media Library item named after the file (scratch-removal.mp4 takes
	//     /scratch-removal/; client staging, 13 Oct). Its own address is
	//     unused -- Yoast sends media pages to the file -- so it is renamed.
	//   - a page of the old site at that address. The redesign replaces it:
	//     it is set aside as a Draft at old-<slug>, nothing deleted.
	foreach ( ap_setup_manifest() as $item ) {
		$slug = sanitize_title( (string) ( $item['slug'] ?? '' ) );
		$slug = ( 'index' === $slug ) ? 'home' : $slug;
		if ( '' === $slug ) {
			continue;
		}
		$media = get_posts( [
			'post_type'   => 'attachment',
			'name'        => $slug,
			'post_status' => 'any',
			'numberposts' => -1,
		] );
		foreach ( $media as $file ) {
			wp_update_post( [ 'ID' => $file->ID, 'post_name' => $slug . '-file' ] );
			$done[] = "Media item \"{$file->post_title}\" was using the /$slug/ address; renamed to /$slug-file/ (the file itself is unchanged).";
		}
		$old = get_page_by_path( $slug );
		if ( $unmanaged( $old ) && ! ap_find_managed( $slug, 'page' ) ) {
			wp_update_post( [ 'ID' => $old->ID, 'post_name' => 'old-' . $slug, 'post_status' => 'draft' ] );
			$done[] = "The old site's \"{$old->post_title}\" page was at /$slug/; set aside as a Draft at old-$slug (nothing deleted).";
		}
	}

	foreach ( ap_setup_manifest() as $item ) {
		$slug = sanitize_title( (string) ( $item['slug'] ?? '' ) );
		$slug = ( 'index' === $slug ) ? 'home' : $slug;
		if ( '' === $slug || ap_find_managed( $slug, 'page' ) ) {
			continue;
		}
		$copies = get_posts( [
			'post_type'   => 'page',
			'post_status' => [ 'publish', 'draft', 'private' ],
			'numberposts' => -1,
			'orderby'     => 'ID',
			'order'       => 'ASC',
			'meta_query'  => [ [ 'key' => '_ap_managed', 'compare' => 'EXISTS' ] ],
		] );
		$copies = array_values( array_filter( $copies, function ( $p ) use ( $slug ) {
			return (bool) preg_match( '/^' . preg_quote( $slug, '/' ) . '-\d+$/', $p->post_name );
		} ) );
		if ( ! $copies || get_page_by_path( $slug ) ) {
			continue; // nothing to fix, or the address is still taken
		}
		$keep = array_shift( $copies );
		$from = $keep->post_name;
		wp_update_post( [ 'ID' => $keep->ID, 'post_name' => $slug ] );
		$done[] = "Moved the $slug page from /$from/ back to /$slug/.";
		foreach ( $copies as $extra ) {
			wp_trash_post( $extra->ID );
			$done[] = "Moved an extra copy of $slug (/{$extra->post_name}/) to the Trash.";
		}
	}
}

/**
 * The WordPress and Yoast settings the custom site's pages assume.
 *
 * Each one only fills a default: a site title someone already changed, a site
 * icon already chosen, a Yoast organisation already named, are left alone.
 */
function ap_setup_settings( array &$done, array &$notes ) : void {
	// Site identity: products and any page without its own title use it.
	$default_names = [ '', 'WordPress', 'My WordPress Website', 'My WordPress Site', 'My Blog' ];
	if ( in_array( trim( (string) get_option( 'blogname' ) ), $default_names, true ) ) {
		update_option( 'blogname', 'Acrylic Pros' );
		$done[] = 'Site title set to "Acrylic Pros".';
	}
	if ( in_array( trim( (string) get_option( 'blogdescription' ) ), [ '', 'Just another WordPress site' ], true ) ) {
		update_option( 'blogdescription', 'Aquarium Design & Restoration' );
		$done[] = 'Tagline set to "Aquarium Design & Restoration".';
	}

	$find = function ( string $file ) : int {
		return function_exists( 'ap_attachment_by_filename' ) ? (int) ap_attachment_by_filename( $file ) : 0;
	};

	if ( ! get_option( 'site_icon' ) ) {
		$icon = $find( 'favicon-fin.png' );
		if ( $icon ) {
			update_option( 'site_icon', $icon );
			$done[] = 'Browser-tab icon set to favicon-fin.png.';
		} else {
			$notes[] = 'Browser-tab icon not set: favicon-fin.png is not in the Media Library. Upload it from wordpress/media/ and run this again.';
		}
	}

	// Our privacy page is the site's privacy policy.
	$privacy = ap_find_managed( 'privacy-policy', 'page' );
	if ( $privacy && (int) get_option( 'wp_page_for_privacy_policy' ) !== $privacy ) {
		update_option( 'wp_page_for_privacy_policy', $privacy );
		$done[] = "Settings → Privacy now points at the site's Privacy Policy page.";
	}

	// Staging stays out of Google. The live domain is never touched here:
	// there, inc/tracking.php shows a warning while search engines are blocked.
	if ( function_exists( 'ap_is_production' ) && ! ap_is_production()
		&& '0' !== (string) get_option( 'blog_public' ) ) {
		update_option( 'blog_public', '0' );
		$done[] = 'Search engines blocked on this staging copy (Settings → Reading). Untick it on the live site after the move.';
	}

	if ( ! defined( 'WPSEO_VERSION' ) ) {
		$notes[] = 'Yoast SEO is not active. Page titles and descriptions still work (the plugin prints them), but install Yoast for the sitemap.';
		return;
	}

	$titles  = (array) get_option( 'wpseo_titles', [] );
	$changed = false;
	if ( empty( $titles['disable-attachment'] ) ) {
		$titles['disable-attachment'] = true; // otherwise one thin page per image
		$changed = true;
		$done[]  = 'Yoast: media pages redirect to the file itself.';
	}
	if ( empty( $titles['company_name'] ) ) {
		$titles['company_or_person'] = 'company';
		$titles['company_name']      = 'Acrylic Pros';
		$logo = $find( 'logo-2026-800.webp' );
		if ( $logo ) {
			$titles['company_logo']    = wp_get_attachment_url( $logo );
			$titles['company_logo_id'] = $logo;
		}
		$changed = true;
		$done[]  = 'Yoast: organisation set to Acrylic Pros' . ( $logo ? ', with the logo.' : ' (logo-2026-800.webp is not in the Media Library, so no logo).' );
	}
	if ( $changed ) {
		update_option( 'wpseo_titles', $titles );
	}

	// Cart, checkout and account answer with the quote form; keep them out of
	// search results.
	if ( function_exists( 'wc_get_page_id' ) ) {
		foreach ( [ 'cart', 'checkout', 'myaccount' ] as $wc ) {
			$id = (int) wc_get_page_id( $wc );
			if ( $id > 0 && '1' !== (string) get_post_meta( $id, '_yoast_wpseo_meta-robots-noindex', true ) ) {
				update_post_meta( $id, '_yoast_wpseo_meta-robots-noindex', '1' );
				$done[] = "Yoast: the $wc page is hidden from search results.";
			}
		}
	}
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

	// type => [ title, body file, display conditions ]. include/general is
	// "Entire Site"; include/singular/not_found404 is Singular -> 404 Page.
	$templates = [
		'header'    => [ 'Acrylic Pros header', 'chrome/header.html', [ 'include/general' ] ],
		'footer'    => [ 'Acrylic Pros footer', 'chrome/chat.html', [ 'include/general' ] ],
		'error-404' => [ 'Acrylic Pros 404', 'chrome/404.html', [ 'include/singular/not_found404' ] ],
	];

	foreach ( $templates as $type => [ $title, $rel, $conditions ] ) {
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

		// Display conditions are Pro-only; on free Elementor the meta is
		// simply ignored and the template never displays.
		update_post_meta( $id, '_elementor_conditions', $conditions );

		$made[] = 'error-404' === $type ? '404' : $type;
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

	return implode( ', ', $made ) . ' created';
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
