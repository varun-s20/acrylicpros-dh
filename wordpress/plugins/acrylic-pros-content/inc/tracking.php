<?php
/**
 * Google Analytics 4 and Search Console -- the client's existing ones.
 *
 * Both IDs are the old acrylicpros.com's own (read from its pages, 12 Oct
 * 2026), so the move keeps the analytics history in one GA4 property and the
 * Search Console verification passes without anyone re-verifying.
 *
 * GA4 loads on the live domain only: the staging copy and local tests would
 * otherwise count as the client's traffic. The verification tag is harmless
 * anywhere, so it is always printed.
 *
 * Conversions: pages.js fires `generate_lead` when a contact or quote form is
 * sent (see FORMS.md). Mark it as a key event in GA4 once data arrives.
 */

defined( 'ABSPATH' ) || exit;

const AP_GA4_ID          = 'G-1TS8M2DGC4';
const AP_GSC_TOKEN       = 'cHjSVHsoxuPY76b0bAEqJTXuT8VJIuojxRvjM6MQ_D4';
const AP_PRODUCTION_HOST = 'acrylicpros.com';

function ap_is_production() : bool {
	$host = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
	return AP_PRODUCTION_HOST === preg_replace( '/^www\./', '', $host );
}

add_action( 'wp_head', function () {
	printf( "<meta name=\"google-site-verification\" content=\"%s\">\n", esc_attr( AP_GSC_TOKEN ) );

	// Not for logged-in editors either: their own clicks are not visitors.
	if ( ! ap_is_production() || is_user_logged_in() ) {
		return;
	}
	printf(
		"<script async src=\"https://www.googletagmanager.com/gtag/js?id=%1\$s\"></script>\n" .
		"<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','%1\$s');</script>\n",
		esc_attr( AP_GA4_ID )
	);
}, 2 );

/**
 * Live domain, search engines still blocked: say so on every admin screen.
 *
 * Staging is built with "Discourage search engines" ticked (inc/setup.php),
 * and the migration copies that setting to the live site. Forgetting to untick
 * it is the classic launch mistake: everything looks perfect and the site never
 * appears in Google.
 */
add_action( 'admin_notices', function () {
	if ( ! ap_is_production() || '0' !== (string) get_option( 'blog_public' ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	printf(
		'<div class="notice notice-error"><p><strong>Google cannot see this site.</strong> "Discourage search engines" is still ticked on the live domain. <a href="%s">Settings &rarr; Reading</a> &rarr; untick it and save.</p></div>',
		esc_url( admin_url( 'options-reading.php' ) )
	);
} );
