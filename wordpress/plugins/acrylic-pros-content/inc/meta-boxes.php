<?php
/**
 * The extra fields each content type needs beyond title and featured image.
 *
 * Classic meta boxes rather than ACF: five fields in total, no licence, no
 * dependency, and they work in both editors.
 */

defined( 'ABSPATH' ) || exit;

/** field key => [ post type, label, hint, type ] */
function ap_fields() : array {
	return [
		'_ap_alt'     => [ 'ap_gallery', 'Alt text',
			'What is in the photo, for screen readers and search. "A curved-front aquarium on a white cabinet, lit blue."',
			'text' ],
		'_ap_link'    => [ 'ap_instagram', 'Instagram URL',
			'https://www.instagram.com/reel/…', 'text' ],
		'_ap_caption' => [ 'ap_instagram', 'Caption',
			'The short line shown over the tile.', 'text' ],
		'_ap_youtube' => [ 'ap_video', 'YouTube ID',
			'Just the ID, not the whole URL — the part after v= or youtu.be/',
			'text' ],
		'_ap_external' => [ 'ap_video', 'Cannot be embedded',
			'Tick this when YouTube refuses to embed the video, and the card will link out to YouTube instead of playing in place. Untick it and the card shows a player that spins and then fails.',
			'checkbox' ],
		'_ap_featured' => [ 'ap_video', 'Featured',
			'Featured videos are shown at full width.', 'checkbox' ],
	];
}

add_action( 'add_meta_boxes', function () {
	foreach ( ap_fields() as $key => [ $type, $label, $hint, $kind ] ) {
		add_meta_box(
			'ap_box_' . ltrim( $key, '_' ),
			$label,
			function ( WP_Post $post ) use ( $key, $hint, $kind, $label ) {
				wp_nonce_field( 'ap_save', 'ap_nonce' );
				$value = (string) get_post_meta( $post->ID, $key, true );

				if ( 'checkbox' === $kind ) {
					printf(
						'<p><label><input type="checkbox" name="%1$s" id="%1$s" value="1" %2$s> %3$s</label></p>',
						esc_attr( $key ),
						checked( $value, '1', false ),
						esc_html( $label )
					);
				} else {
					printf(
						'<p><input type="text" name="%1$s" id="%1$s" value="%2$s" class="widefat" placeholder="%3$s"></p>',
						esc_attr( $key ),
						esc_attr( $value ),
						esc_attr( $hint )
					);
				}
				printf( '<p class="description">%s</p>', esc_html( $hint ) );
			},
			$type,
			'side'
		);
	}
} );

/**
 * Save. The four checks are in the order that matters: autosave first (it
 * posts no fields, so saving here would blank every one of them), then the
 * nonce, then the capability, and only then the write.
 *
 * wp_unslash before sanitising, because WordPress slashes $_POST — skip it and
 * every apostrophe in an alt text gains a backslash, one save at a time.
 */
add_action( 'save_post', function ( $post_id ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! isset( $_POST['ap_nonce'] )
		|| ! wp_verify_nonce( sanitize_key( $_POST['ap_nonce'] ), 'ap_save' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$type = get_post_type( $post_id );

	foreach ( ap_fields() as $key => [ $for_type, , , $kind ] ) {
		if ( $for_type !== $type ) {
			continue;
		}

		// An unticked checkbox posts nothing at all, so it has to be written
		// unconditionally. Skipping it on `! isset` would make the box
		// tickable but never untickable.
		if ( 'checkbox' === $kind ) {
			update_post_meta( $post_id, $key, isset( $_POST[ $key ] ) ? '1' : '' );
			continue;
		}

		if ( ! isset( $_POST[ $key ] ) ) {
			continue;
		}
		$raw   = wp_unslash( $_POST[ $key ] );
		$value = ( '_ap_link' === $key )
			? esc_url_raw( $raw )
			: sanitize_text_field( $raw );
		update_post_meta( $post_id, $key, $value );
	}
} );
