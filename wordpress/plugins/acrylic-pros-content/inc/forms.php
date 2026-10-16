<?php
/**
 * Contact and quote forms: receive, keep, email.
 *
 * The two forms are the prototype's own markup (contact.html, quote.html), not
 * Contact Form 7: pages.js validates them inline and, once
 * window.AP_FORM_ENDPOINT is set, POSTs them here. Without the endpoint (the
 * static site, or this plugin switched off) pages.js keeps its "not connected
 * -- call us" notice, so a visitor is never shown a success that did not happen.
 *
 * Each submission is
 *   1. screened for bots -- a honeypot, a minimum time on the page, and a
 *      per-visitor rate limit (no nonce: page caching would serve a stale one
 *      and fail real visitors a day later);
 *   2. validated again here, against a whitelist per form -- anything not in
 *      the list is dropped, anything required and missing is refused;
 *   3. saved as a private `ap_enquiry` post (wp-admin -> Enquiries), so nothing
 *      is lost if the email is filtered or the mail server is down;
 *   4. emailed to the address under Enquiries -> Settings (default
 *      info@acrylicpros.com), Reply-To the visitor, From the site's own domain.
 *
 * Deliverability: wp_mail() from shared hosting is often dropped silently by
 * Gmail and Outlook. Install WP Mail SMTP (see FORMS.md); it replaces
 * wp_mail()'s transport, so nothing here changes.
 */

defined( 'ABSPATH' ) || exit;

const AP_ENQUIRY_DEFAULT_TO = 'info@acrylicpros.com';

/**
 * The two forms. Field => [ label, kind, required, allowed values ].
 * Kinds: text, email, tel, textarea, number, choice (one of), multi (any of),
 * consent (must be ticked). Names match the markup exactly -- see FORMS.md.
 */
function ap_enquiry_forms() : array {
	return [
		'contact' => [
			'label'  => 'Contact',
			'fields' => [
				'name'     => [ 'Name', 'text', true ],
				'email'    => [ 'Email', 'email', true ],
				'phone'    => [ 'Phone', 'tel', false ],
				'subject'  => [ 'Subject', 'text', true ],
				'interest' => [ 'Interested in', 'multi', false, [ 'Restoration & care', 'Design & build', 'Livestock' ] ],
				'premises' => [ 'Premises', 'choice', false, [ 'Residential', 'Commercial' ] ],
				'message'  => [ 'Message', 'textarea', true ],
				'consent'  => [ 'Consent to be contacted', 'consent', true ],
			],
		],
		'quote'   => [
			'label'  => 'Quote request',
			'fields' => [
				'name'               => [ 'Name', 'text', true ],
				'company'            => [ 'Company', 'text', false ],
				'email'              => [ 'Email', 'email', true ],
				'phone'              => [ 'Phone', 'tel', true ],
				'contact_preference' => [ 'Preferred contact', 'choice', false, [ 'Phone', 'Email', 'Text', 'WhatsApp' ] ],
				'address'            => [ 'Address', 'text', true ],
				'city'               => [ 'City', 'text', true ],
				'state'              => [ 'State', 'text', true ],
				'zip'                => [ 'ZIP', 'text', true ],
				'country'            => [ 'Country', 'text', true ],
				'premises'           => [ 'Premises', 'choice', false, [ 'Residential', 'Business' ] ],
				'service'            => [ 'Service', 'text', true ],
				'length'             => [ 'Length (in)', 'number', false ],
				'width'              => [ 'Width (in)', 'number', false ],
				'height'             => [ 'Height (in)', 'number', false ],
				'water_type'         => [ 'Water type', 'choice', false, [ 'Fresh Water', 'Salt Water', 'Live Reef', 'Not applicable' ] ],
				'panels'             => [ 'Panels', 'multi', false, [ 'Inside Left', 'Outside Left', 'Inside Right', 'Outside Right', 'Inside Back', 'Outside Back', 'Inside Front', 'Outside Front' ] ],
				'water_state'        => [ 'Water', 'choice', false, [ 'Can be drained', 'Must stay full and running', 'Not sure' ] ],
				'animals'            => [ 'Animals in the tank', 'textarea', false ],
				'message'            => [ 'Message', 'textarea', false ],
				'consent'            => [ 'Consent to be contacted', 'consent', true ],
			],
		],
	];
}

/* -------------------------------------------------------------------------
   Storage: a private post type, read in wp-admin, never on the front end
   ------------------------------------------------------------------------- */

add_action( 'init', function () {
	register_post_type( 'ap_enquiry', [
		'labels'          => [
			'name'               => 'Enquiries',
			'singular_name'      => 'Enquiry',
			'edit_item'          => 'Enquiry',
			'view_item'          => 'View enquiry',
			'search_items'       => 'Search enquiries',
			'not_found'          => 'No enquiries yet',
			'not_found_in_trash' => 'No enquiries in the bin',
			'all_items'          => 'All enquiries',
			'menu_name'          => 'Enquiries',
		],
		'public'          => false,
		'show_ui'         => true,
		'show_in_menu'    => true,
		'show_in_rest'    => false,
		'menu_icon'       => 'dashicons-email-alt',
		'menu_position'   => 25,
		'supports'        => [ 'title', 'editor' ],
		'has_archive'     => false,
		'rewrite'         => false,
		'capability_type' => 'post',
		'map_meta_cap'    => true,
		// Enquiries only ever arrive from the forms.
		'capabilities'    => [ 'create_posts' => 'do_not_allow' ],
	] );
} );

add_filter( 'manage_ap_enquiry_posts_columns', function ( array $cols ) : array {
	return [
		'cb'          => $cols['cb'] ?? '',
		'title'       => 'Enquiry',
		'ap_form'     => 'Form',
		'ap_email'    => 'Email',
		'ap_phone'    => 'Phone',
		'ap_mail'     => 'Emailed',
		'date'        => 'Received',
	];
} );

add_action( 'manage_ap_enquiry_posts_custom_column', function ( string $col, int $post_id ) {
	switch ( $col ) {
		case 'ap_form':
			$forms = ap_enquiry_forms();
			$key   = get_post_meta( $post_id, '_ap_form', true );
			echo esc_html( $forms[ $key ]['label'] ?? $key );
			break;
		case 'ap_email':
			$email = get_post_meta( $post_id, '_ap_email', true );
			if ( $email ) {
				printf( '<a href="mailto:%1$s">%1$s</a>', esc_attr( $email ) );
			}
			break;
		case 'ap_phone':
			echo esc_html( get_post_meta( $post_id, '_ap_phone', true ) );
			break;
		case 'ap_mail':
			echo get_post_meta( $post_id, '_ap_mail_sent', true )
				? 'Yes'
				: '<strong style="color:#b32d2e">Not sent &mdash; check mail settings</strong>';
			break;
	}
}, 10, 2 );

/* -------------------------------------------------------------------------
   Settings: where the email goes
   ------------------------------------------------------------------------- */

function ap_enquiry_recipients() : array {
	$raw = (string) get_option( 'ap_enquiry_to', AP_ENQUIRY_DEFAULT_TO );
	$out = array_values( array_filter( array_map( 'sanitize_email', preg_split( '/[\s,;]+/', $raw ) ), 'is_email' ) );
	return $out ? $out : [ AP_ENQUIRY_DEFAULT_TO ];
}

add_action( 'admin_init', function () {
	register_setting( 'ap_enquiry', 'ap_enquiry_to', [
		'type'              => 'string',
		'default'           => AP_ENQUIRY_DEFAULT_TO,
		'sanitize_callback' => function ( $value ) {
			$emails = array_filter( array_map( 'sanitize_email', preg_split( '/[\s,;]+/', (string) $value ) ), 'is_email' );
			if ( ! $emails ) {
				add_settings_error( 'ap_enquiry_to', 'ap_enquiry_to', 'Enter at least one valid email address.' );
				return get_option( 'ap_enquiry_to', AP_ENQUIRY_DEFAULT_TO );
			}
			return implode( ', ', $emails );
		},
	] );
} );

add_action( 'admin_menu', function () {
	add_submenu_page(
		'edit.php?post_type=ap_enquiry',
		'Enquiry settings',
		'Settings',
		'manage_options',
		'ap-enquiry-settings',
		'ap_enquiry_settings_page'
	);
} );

function ap_enquiry_settings_page() : void {
	?>
	<div class="wrap">
		<h1>Enquiry settings</h1>
		<?php settings_errors(); // a page outside Settings must print its own notices ?>
		<p>Contact and quote form submissions are saved under <strong>Enquiries</strong> and emailed to the address below.</p>
		<form method="post" action="options.php">
			<?php settings_fields( 'ap_enquiry' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="ap_enquiry_to">Send enquiries to</label></th>
					<td>
						<input type="text" class="regular-text" id="ap_enquiry_to" name="ap_enquiry_to"
							value="<?php echo esc_attr( implode( ', ', ap_enquiry_recipients() ) ); ?>">
						<p class="description">One address, or several separated by commas.</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
		<p>If the <em>Emailed</em> column on the enquiry list says <strong>Not sent</strong>, this site cannot send mail yet:
			install <strong>WP Mail SMTP</strong> and connect it to the business mailbox.</p>
	</div>
	<?php
}

/* -------------------------------------------------------------------------
   The endpoint
   ------------------------------------------------------------------------- */

add_action( 'rest_api_init', function () {
	register_rest_route( 'ap/v1', '/enquiry', [
		'methods'             => 'POST',
		'callback'            => 'ap_enquiry_receive',
		'permission_callback' => '__return_true',
	] );
} );

/** Hand the endpoint to pages.js. Priority 1: before the deferred scripts. */
add_action( 'wp_head', function () {
	printf( "<script>window.AP_FORM_ENDPOINT=%s;</script>\n", wp_json_encode( rest_url( 'ap/v1/enquiry' ) ) );
}, 1 );

function ap_enquiry_receive( WP_REST_Request $request ) {
	$params = $request->get_body_params();
	$forms  = ap_enquiry_forms();
	$key    = isset( $params['_form'] ) ? sanitize_key( $params['_form'] ) : '';

	if ( ! isset( $forms[ $key ] ) ) {
		return new WP_REST_Response( [ 'ok' => false, 'message' => 'Unknown form.' ], 400 );
	}

	// Honeypot: a field people never see. A bot that fills it is told it
	// worked, so it has no reason to try again, and nothing is kept.
	if ( ! empty( $params['_hp'] ) ) {
		return new WP_REST_Response( [ 'ok' => true ], 200 );
	}

	// Nobody completes these forms in under three seconds.
	$elapsed = isset( $params['_t'] ) ? (int) $params['_t'] : 0;
	if ( $elapsed < 3 ) {
		return new WP_REST_Response( [ 'ok' => false, 'message' => 'Please try again.' ], 400 );
	}

	// Rate limit: five per ten minutes per visitor. Only a hash of the address
	// is held, and only for the ten minutes.
	$ip       = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	$throttle = 'ap_enq_' . substr( hash( 'sha256', $ip . wp_salt( 'nonce' ) ), 0, 20 );
	$count    = (int) get_transient( $throttle );
	if ( $count >= 5 ) {
		return new WP_REST_Response( [ 'ok' => false, 'message' => 'Too many requests. Please call us instead.' ], 429 );
	}
	set_transient( $throttle, $count + 1, 10 * MINUTE_IN_SECONDS );

	[ $clean, $errors ] = ap_enquiry_clean( $forms[ $key ]['fields'], $params );
	if ( $errors ) {
		return new WP_REST_Response( [ 'ok' => false, 'errors' => $errors ], 422 );
	}

	$label = $forms[ $key ]['label'];
	// The page it came from: a plain site path only, never a full URL.
	$path  = isset( $params['_page'] ) ? (string) $params['_page'] : '';
	$page  = preg_match( '#^/[A-Za-z0-9/_.\-]*$#', $path ) ? esc_url_raw( home_url( $path ) ) : '';
	$body  = ap_enquiry_text( $forms[ $key ]['fields'], $clean, $page );

	// Every value is already plain text (tags stripped above). Saving as a
	// logged-out visitor would otherwise run it through kses, which turns
	// "Restoration & care" into "Restoration &amp; care" in wp-admin.
	$kses = false !== has_filter( 'content_save_pre', 'wp_filter_post_kses' );
	kses_remove_filters();
	$post_id = wp_insert_post( wp_slash( [
		'post_type'    => 'ap_enquiry',
		'post_status'  => 'private',
		'post_title'   => sprintf( '%s — %s', $label, $clean['name'] ),
		'post_content' => $body,
	] ), true );
	if ( $kses ) {
		kses_init_filters();
	}

	if ( is_wp_error( $post_id ) ) {
		return new WP_REST_Response( [ 'ok' => false, 'message' => 'Could not save.' ], 500 );
	}

	update_post_meta( $post_id, '_ap_form', $key );
	foreach ( $clean as $field => $value ) {
		// update_post_meta() unslashes, so slash first or backslashes vanish.
		update_post_meta( $post_id, '_ap_' . $field, wp_slash( $value ) );
	}

	// Reply-To is the visitor; From stays on the site's own domain, so the
	// message passes SPF/DKIM instead of looking like spoofed mail.
	$reply_name = trim( preg_replace( '/\s+/', ' ', preg_replace( '/[\r\n<>",;]+/', ' ', $clean['name'] ) ) );
	$sent       = wp_mail(
		ap_enquiry_recipients(),
		sprintf( '[Acrylic Pros] %s from %s', $label, $reply_name ),
		$body . "\n\nAlso saved in wp-admin under Enquiries.",
		[
			'Content-Type: text/plain; charset=UTF-8',
			sprintf( 'Reply-To: %s <%s>', $reply_name, $clean['email'] ),
		]
	);
	update_post_meta( $post_id, '_ap_mail_sent', $sent ? 1 : 0 );

	// Saved is what counts: the enquiry is in wp-admin even if mail failed.
	return new WP_REST_Response( [ 'ok' => true ], 200 );
}

/**
 * Validate and sanitise against the whitelist. Returns [ clean, errors ].
 */
function ap_enquiry_clean( array $fields, array $params ) : array {
	$clean  = [];
	$errors = [];

	foreach ( $fields as $name => $spec ) {
		[ $label, $kind, $required ] = $spec;
		$allowed = $spec[3] ?? [];
		$raw     = $params[ $name ] ?? null;

		switch ( $kind ) {
			case 'multi':
				$values = array_values( array_intersect( array_map( 'sanitize_text_field', (array) $raw ), $allowed ) );
				$value  = implode( ', ', $values );
				break;
			case 'choice':
				$value = sanitize_text_field( is_scalar( $raw ) ? (string) $raw : '' );
				if ( '' !== $value && ! in_array( $value, $allowed, true ) ) {
					$value = '';
				}
				break;
			case 'consent':
				$value = ( is_scalar( $raw ) && '' !== (string) $raw ) ? 'Yes' : '';
				break;
			case 'email':
				// Checked before sanitising: sanitize_email() empties a malformed
				// address, which would otherwise report it as missing.
				$typed = trim( is_scalar( $raw ) ? (string) $raw : '' );
				$value = sanitize_email( $typed );
				if ( '' !== $typed && ( '' === $value || ! is_email( $value ) ) ) {
					$errors[ $name ] = 'Enter a valid email address, for example name@example.com.';
					$value           = '';
				}
				break;
			case 'number':
				$value = is_scalar( $raw ) ? trim( (string) $raw ) : '';
				if ( '' !== $value && ! is_numeric( $value ) ) {
					$errors[ $name ] = 'Enter a number.';
				}
				break;
			case 'textarea':
				$value = mb_substr( sanitize_textarea_field( is_scalar( $raw ) ? (string) $raw : '' ), 0, 5000 );
				break;
			default: // text, tel
				$value = mb_substr( sanitize_text_field( is_scalar( $raw ) ? (string) $raw : '' ), 0, 200 );
		}

		if ( $required && '' === $value && ! isset( $errors[ $name ] ) ) {
			$errors[ $name ] = 'consent' === $kind ? 'Please tick this box to continue.' : $label . ' is required.';
		}
		$clean[ $name ] = $value;
	}

	return [ $clean, $errors ];
}

/** Plain-text summary: the email body and the saved post's content. */
function ap_enquiry_text( array $fields, array $clean, string $page ) : string {
	$lines = [];
	foreach ( $fields as $name => $spec ) {
		if ( '' === $clean[ $name ] || 'consent' === $spec[1] ) {
			continue;
		}
		$lines[] = $spec[0] . ': ' . $clean[ $name ];
	}
	$lines[] = '';
	$lines[] = 'Consent to be contacted: Yes';
	if ( $page ) {
		$lines[] = 'Sent from: ' . $page;
	}
	return implode( "\n", $lines );
}
