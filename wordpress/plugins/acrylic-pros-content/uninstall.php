<?php
/**
 * Uninstall removes the plugin's own options and transients, and nothing else.
 *
 * It deliberately does NOT delete the gallery photos, Instagram posts or
 * videos. Somebody deactivating a plugin while debugging must not be able to
 * destroy the client's content, and that loss is unrecoverable.
 *
 * The post types disappear from wp-admin while the plugin is inactive, because
 * nothing is registering them any more, but every row is still in the
 * database and comes back the moment it is reactivated.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'ap_settings' );
delete_transient( 'ap_gallery_cache' );
