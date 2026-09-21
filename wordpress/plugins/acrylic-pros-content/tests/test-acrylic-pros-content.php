<?php
/**
 * Runnable without WordPress:
 *
 *     php tests/test-acrylic-pros-content.php
 *
 * It stubs the handful of WordPress functions the shell logic touches, then
 * asserts on the part that actually breaks in practice: which body class and
 * nav key a given request resolves to. Getting that wrong does not throw an
 * error — it renders the page in the wrong palette, which is the failure mode
 * this build is most likely to hit after someone adds a page.
 */

// --- stubs ---------------------------------------------------------------

define( 'ABSPATH', __DIR__ );

$GLOBALS['ap_test_state'] = [
	'front'    => false,
	'product'  => false,
	'shop'     => false,
	'queried'  => null,
];

// inc/preload.php registers its hook at load time, so this has to exist
// before it is required. The test only cares about the data, not the hook.
function add_action( $hook, $cb, $priority = 10, $args = 1 ) {}

function is_front_page() { return $GLOBALS['ap_test_state']['front']; }
function is_singular( $t = '' ) { return 'product' === $t && $GLOBALS['ap_test_state']['product']; }
function is_post_type_archive( $t = '' ) { return 'product' === $t && $GLOBALS['ap_test_state']['shop']; }
function is_shop() { return $GLOBALS['ap_test_state']['shop']; }
function get_queried_object() { return $GLOBALS['ap_test_state']['queried']; }

class WP_Post {
	public $post_name;
	public function __construct( $slug ) { $this->post_name = $slug; }
}

require_once __DIR__ . '/../inc/page-map.php';

// ap_current_shell lives in assets.php beside a pile of add_action calls, so
// rather than load and stub all of WordPress, the function is pulled out of
// the file on its own.
$src = file_get_contents( __DIR__ . '/../inc/assets.php' );
if ( ! preg_match( '/function ap_current_shell.*?\n}\n/s', $src, $m ) ) {
	fwrite( STDERR, "could not find ap_current_shell() in inc/assets.php\n" );
	exit( 1 );
}
eval( $m[0] );

// --- helpers -------------------------------------------------------------

$tests = 0;
$fails = 0;

function ok( string $what, bool $cond, string $detail = '' ) : void {
	global $tests, $fails;
	$tests++;
	if ( $cond ) {
		echo "PASS  $what\n";
	} else {
		$fails++;
		echo "FAIL  $what" . ( $detail ? "  — $detail" : '' ) . "\n";
	}
}

function request( array $state ) : array {
	$GLOBALS['ap_test_state'] = array_merge(
		[ 'front' => false, 'product' => false, 'shop' => false, 'queried' => null ],
		$state
	);
	return ap_current_shell();
}

// --- the map itself ------------------------------------------------------

$map = ap_page_map();

ok( 'page map is not empty', count( $map ) > 20, count( $map ) . ' entries' );
ok( 'page map has a front-page entry', isset( $map['front'] ) );

// Only these keys exist as data-nav-item values in the header markup. A key
// outside this set silently highlights nothing.
$valid_nav = [ '', 'home', 'about', 'services', 'gallery', 'videos', 'process', 'glass-tanks' ];

foreach ( $map as $slug => $entry ) {
	if ( ! is_array( $entry ) || 2 !== count( $entry ) ) {
		ok( "map entry $slug is [class, nav]", false );
		continue;
	}
	[ $class, $nav ] = $entry;
	ok( "map entry $slug has a body class", '' !== trim( $class ), var_export( $class, true ) );
	ok( "map entry $slug has a known nav key", in_array( $nav, $valid_nav, true ), "got '$nav'" );
}

// --- resolution ----------------------------------------------------------

[ $class, $nav ] = request( [ 'front' => true ] );
ok( 'front page gets t-home', 't-home' === $class, $class );
ok( 'front page highlights Home', 'home' === $nav, $nav );

[ $class, $nav ] = request( [ 'product' => true ] );
ok( 'single product gets the product shell',
	't-inner t-shop t-product' === $class, $class );
ok( 'single product highlights Glass tanks', 'glass-tanks' === $nav, $nav );

[ $class, $nav ] = request( [ 'shop' => true ] );
ok( 'shop archive gets the shop shell', false !== strpos( $class, 't-shop' ), $class );

[ $class, $nav ] = request( [ 'queried' => new WP_Post( 'about' ) ] );
ok( 'about resolves from the map', 't-inner t-about' === $class, $class );
ok( 'about highlights About', 'about' === $nav, $nav );

[ $class, $nav ] = request( [ 'queried' => new WP_Post( 'scratch-removal' ) ] );
ok( 'a service page highlights Services', 'services' === $nav, $nav );

// The important one: an unknown page must degrade, not explode.
[ $class, $nav ] = request( [ 'queried' => new WP_Post( 'a-page-added-next-year' ) ] );
ok( 'an unmapped page falls back to the neutral shell', 't-inner' === $class, $class );
ok( 'an unmapped page highlights nothing', '' === $nav, $nav );

[ $class, $nav ] = request( [] );
ok( 'no queried object still returns a shell', 't-inner' === $class, $class );

// --- front page must win over a page called "front" ----------------------

[ $class ] = request( [ 'front' => true, 'queried' => new WP_Post( 'about' ) ] );
ok( 'front page beats the queried object', 't-home' === $class, $class );

// --- preload hints ---------------------------------------------------------
//
// These exist only because WordPress owns <head> and the static build's own
// preload tags cannot survive the conversion. If this map empties, nothing
// breaks visibly — the hero image on 14 pages just quietly stops being
// prioritised — so it is worth asserting rather than eyeballing.

require_once __DIR__ . '/../inc/preload.php';
$pre = ap_preloads();

ok( 'preload map is populated', count( $pre ) >= 10, count( $pre ) . ' entries' );

foreach ( $pre as $slug => $html ) {
	ok( "preload $slug is a link tag",
		false !== strpos( $html, '<link rel="preload"' ), substr( $html, 0, 40 ) );
	ok( "preload $slug points at the Media Library",
		false === strpos( $html, 'assets/images' )
		&& false === strpos( $html, '../' ),
		$html );
	ok( "preload $slug carries no hardcoded domain",
		false === strpos( $html, '//acrylicpros.com' ), $html );
}

// Every page in the map must be a page the shell also knows about, or the
// preload fires on a slug that does not exist.
$map = ap_page_map();
foreach ( array_keys( $pre ) as $slug ) {
	ok( "preload $slug is a known page", isset( $map[ $slug ] ), $slug );
}

// --- the setup payload -----------------------------------------------------
//
// inc/setup.php builds every page from wp-admin. None of this can be tested
// against a real WordPress from here, so what is checked is the part that is
// ours and would be silently wrong: the Elementor tree, and that every page in
// the manifest actually has a body file to put in it.

define( 'AP_DIR', __DIR__ . '/../' );

function wp_json_encode( $data ) { return json_encode( $data ); }
function add_management_page() {}
function sanitize_title( $s ) { return strtolower( trim( $s ) ); }

require_once __DIR__ . '/../inc/setup.php';

$manifest = ap_setup_manifest();
ok( 'setup manifest is populated', count( $manifest ) >= 20, count( $manifest ) . ' pages' );

$seen_front = false;
foreach ( $manifest as $item ) {
	$slug = $item['slug'];
	ok( "manifest $slug has a title", '' !== trim( (string) $item['title'] ), var_export( $item['title'], true ) );
	ok( "manifest $slug has a body file",
		file_exists( AP_DIR . 'data/pages/' . $slug . '.html' ) );
	if ( 'index' === $slug ) {
		$seen_front = true;
	}
}
ok( 'manifest contains the front page', $seen_front );

// Chrome for the two Theme Builder templates.
ok( 'header chrome is bundled', file_exists( AP_DIR . 'data/chrome/header.html' ) );
ok( 'footer chrome is bundled', file_exists( AP_DIR . 'data/chrome/chat.html' ) );

// The tree itself. The markup contains double quotes, angle brackets, newlines
// and non-ASCII; if any of that does not survive the JSON round trip, every
// page renders mangled and it is not obvious why.
$sample = file_get_contents( AP_DIR . 'data/pages/about.html' );
$tree   = ap_elementor_tree( $sample );

ok( 'tree has one top-level container',
	1 === count( $tree ) && 'container' === $tree[0]['elType'] );
ok( 'container is full width', 'full' === $tree[0]['settings']['content_width'] );
ok( 'container tag is div, not main',
	'div' === $tree[0]['settings']['html_tag'],
	$tree[0]['settings']['html_tag'] );
ok( 'container has zero padding',
	'0' === $tree[0]['settings']['padding']['top']
	&& '0' === $tree[0]['settings']['padding']['bottom'] );

$widget = $tree[0]['elements'][0];
ok( 'child is an html widget',
	'widget' === $widget['elType'] && 'html' === $widget['widgetType'] );

$round = json_decode( json_encode( $tree ), true );
ok( 'markup survives the JSON round trip',
	$round[0]['elements'][0]['settings']['html'] === $sample,
	'length ' . strlen( $round[0]['elements'][0]['settings']['html'] )
	. ' vs ' . strlen( $sample ) );

ok( 'encoded tree is valid JSON', null !== json_decode( json_encode( $tree ) ) );

// Ids must be stable across runs, or every re-run rewrites every page and
// Elementor treats them as new elements.
$again = ap_elementor_tree( $sample );
ok( 'element ids are deterministic',
	$again[0]['id'] === $tree[0]['id']
	&& $again[0]['elements'][0]['id'] === $widget['id'] );

// ...and distinct between the container and the widget.
ok( 'container and widget ids differ', $tree[0]['id'] !== $widget['id'] );

echo "\n" . ( $tests - $fails ) . "/$tests passed\n";
exit( $fails ? 1 : 0 );
