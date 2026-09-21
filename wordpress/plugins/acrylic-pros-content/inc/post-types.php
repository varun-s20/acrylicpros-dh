<?php
/**
 * The three content types the owner maintains.
 *
 * None of them has an archive or a single view: they are only ever rendered
 * into the existing page designs through their shortcodes. `public => false`
 * with `show_ui => true` is what says that — it keeps wp-admin fully usable
 * while making sure WordPress never invents a /ap_gallery/… URL that would
 * render in the bare theme with none of this design on it.
 */

defined( 'ABSPATH' ) || exit;

function ap_register_post_types() : void {

	register_post_type( 'ap_gallery', [
		'labels' => [
			'name'               => 'Gallery',
			'singular_name'      => 'Gallery photo',
			'add_new_item'       => 'Add a gallery photo',
			'edit_item'          => 'Edit gallery photo',
			'new_item'           => 'New gallery photo',
			'view_item'          => 'View gallery photo',
			'search_items'       => 'Search gallery photos',
			'not_found'          => 'No gallery photos yet',
			'not_found_in_trash' => 'No gallery photos in the bin',
			'all_items'          => 'All photos',
			'menu_name'          => 'Gallery',
		],
		'public'       => false,
		'show_ui'      => true,
		'show_in_menu' => true,
		'show_in_rest' => true,
		'menu_icon'    => 'dashicons-format-gallery',
		'menu_position' => 21,
		'supports'     => [ 'title', 'thumbnail', 'page-attributes' ],
		'has_archive'  => false,
		'rewrite'      => false,
	] );

	register_taxonomy( 'ap_gallery_cat', 'ap_gallery', [
		'labels' => [
			'name'          => 'Gallery categories',
			'singular_name' => 'Gallery category',
			'add_new_item'  => 'Add a gallery category',
			'menu_name'     => 'Categories',
		],
		'public'            => false,
		'show_ui'           => true,
		'show_admin_column' => true,
		'show_in_rest'      => true,
		'hierarchical'      => true,
		'rewrite'           => false,
	] );

	register_post_type( 'ap_instagram', [
		'labels' => [
			'name'          => 'Instagram',
			'singular_name' => 'Instagram post',
			'add_new_item'  => 'Add an Instagram post',
			'edit_item'     => 'Edit Instagram post',
			'all_items'     => 'All posts',
			'not_found'     => 'No Instagram posts yet',
			'menu_name'     => 'Instagram',
		],
		'public'        => false,
		'show_ui'       => true,
		'show_in_menu'  => true,
		'show_in_rest'  => true,
		'menu_icon'     => 'dashicons-instagram',
		'menu_position' => 22,
		'supports'      => [ 'title', 'thumbnail', 'page-attributes' ],
		'has_archive'   => false,
		'rewrite'       => false,
	] );

	register_post_type( 'ap_video', [
		'labels' => [
			'name'          => 'Videos',
			'singular_name' => 'Video',
			'add_new_item'  => 'Add a video',
			'edit_item'     => 'Edit video',
			'all_items'     => 'All videos',
			'not_found'     => 'No videos yet',
			'menu_name'     => 'Videos',
		],
		'public'        => false,
		'show_ui'       => true,
		'show_in_menu'  => true,
		'show_in_rest'  => true,
		'menu_icon'     => 'dashicons-video-alt3',
		'menu_position' => 23,
		'supports'      => [ 'title', 'thumbnail', 'page-attributes' ],
		'has_archive'   => false,
		'rewrite'       => false,
	] );
}
add_action( 'init', 'ap_register_post_types' );

/**
 * Order by the drag-and-drop "Order" field, then oldest first, which is how
 * the prototype's JSON files were ordered. Without this the owner has no way
 * to control where a new photo lands.
 */
function ap_query( string $type, int $count = -1 ) : WP_Query {
	return new WP_Query( [
		'post_type'           => $type,
		'post_status'         => 'publish',
		'posts_per_page'      => $count,
		'orderby'             => [ 'menu_order' => 'ASC', 'date' => 'ASC' ],
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	] );
}

/**
 * Admin list tables: show the photo. The owner identifies these by the picture,
 * never by the title, and a list of 35 identical rows is a support ticket.
 */
foreach ( [ 'ap_gallery', 'ap_instagram', 'ap_video' ] as $ap_type ) {
	add_filter( "manage_{$ap_type}_posts_columns", function ( array $cols ) : array {
		return array_merge( [ 'cb' => $cols['cb'], 'ap_thumb' => 'Photo' ], $cols );
	} );
	add_action( "manage_{$ap_type}_posts_custom_column", function ( $col, $post_id ) {
		if ( 'ap_thumb' === $col ) {
			echo get_the_post_thumbnail( $post_id, [ 60, 60 ] ) ?: '—';
		}
	}, 10, 2 );
}
