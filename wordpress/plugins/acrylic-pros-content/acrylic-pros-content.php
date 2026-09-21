<?php
/**
 * Plugin Name:       Acrylic Pros — Site
 * Description:       Carries the Acrylic Pros design into WordPress: the global
 *                    stylesheet and script, the page shell classes the CSS needs,
 *                    and the gallery, Instagram and video content types the owner
 *                    edits. Everything lives here rather than in the theme, so a
 *                    theme change cannot take the design or the content with it.
 * Version:           1.0.2
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

define( 'AP_VER', '1.0.2' );
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
