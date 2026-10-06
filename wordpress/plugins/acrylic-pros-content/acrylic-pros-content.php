<?php
/**
 * Plugin Name:       Acrylic Pros — Site
 * Description:       Carries the Acrylic Pros design into WordPress: the global
 *                    stylesheet and script, the page shell classes the CSS needs,
 *                    and the gallery, Instagram and video content types the owner
 *                    edits. Everything lives here rather than in the theme, so a
 *                    theme change cannot take the design or the content with it.
 * Version:           1.6.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Digital Heroes
 * Text Domain:       acrylic-pros
 *
 * There is no SFTP on this host, which is why so much lives in a plugin: a
 * plugin is the only thing wp-admin can install that ships its own files. The
 * stylesheet, the script and the .woff2 fonts could not go anywhere else —
 * the Media Library rejects .woff2 outright.
 */

defined( 'ABSPATH' ) || exit;

define( 'AP_VER', '1.6.0' );
define( 'AP_DIR', plugin_dir_path( __FILE__ ) );
define( 'AP_URL', plugin_dir_url( __FILE__ ) );

require_once AP_DIR . 'inc/page-map.php';
require_once AP_DIR . 'inc/assets.php';
require_once AP_DIR . 'inc/elementor.php';
require_once AP_DIR . 'inc/post-types.php';
require_once AP_DIR . 'inc/meta-boxes.php';
require_once AP_DIR . 'inc/shortcodes.php';
require_once AP_DIR . 'inc/preload.php';
require_once AP_DIR . 'inc/schema.php';
require_once AP_DIR . 'inc/woocommerce.php'; // no-op until WooCommerce is active

// One-time content seeding. Delete inc/import.php and this line after
// handover -- see the note at the top of that file.
if ( is_admin() ) {
	require_once AP_DIR . 'inc/import.php';
	require_once AP_DIR . 'inc/setup.php';
	require_once AP_DIR . 'inc/media.php';
}

register_activation_hook( __FILE__, function () {
	ap_register_post_types();
	flush_rewrite_rules();
} );

register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );

// Retired pages (3 Oct 2026): Featured Projects was merged into Scratch Removal.
// Old links and search results get a 301 there -- but only once the page is
// gone (trashed), because this runs on a 404 only. While the page exists it is
// served as is. Priority 1, ahead of WordPress's own 404 slug-guessing, which
// would otherwise send the visitor to whatever page has the closest name.
add_action( 'template_redirect', function () {
	if ( ! is_404() ) {
		return;
	}
	$path    = (string) wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ?? '' ), PHP_URL_PATH ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$retired = [ 'featured-projects' => '/scratch-removal/' ];
	foreach ( $retired as $old => $new ) {
		if ( preg_match( '#(?:^|/)' . preg_quote( $old, '#' ) . '/?$#', $path ) ) {
			wp_safe_redirect( home_url( $new ), 301 );
			exit;
		}
	}
}, 1 );
