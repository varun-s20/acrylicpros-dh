<?php
/**
 * Exercises the file-moving logic in inc/media.php against a real temp tree.
 *
 * This is the only code in the plugin that moves or deletes anything, so it is
 * the one piece worth testing properly rather than reading twice. Run it with:
 *
 *     php tests/test-media-move.php
 */

define( 'ABSPATH', __DIR__ );

$ROOT = sys_get_temp_dir() . '/ap-move-test-' . getmypid();
@mkdir( $ROOT, 0777, true );

function wp_get_upload_dir() { return [ 'basedir' => $GLOBALS['ROOT'], 'baseurl' => 'http://x/u', 'subdir' => '' ]; }
function trailingslashit( $s ) { return rtrim( $s, '/\\' ) . '/'; }
function sanitize_file_name( $s ) { return preg_replace( '/[^A-Za-z0-9._-]/', '', $s ); }
function wp_unslash( $s ) { return $s; }

// Only the functions under test, pulled out of media.php so the admin hooks
// and WP dependencies do not have to be stubbed.
$src = file_get_contents( __DIR__ . '/../inc/media.php' );
foreach ( [ 'ap_reserved_upload_dirs', 'ap_media_files_in', 'ap_misplaced_uploads', 'ap_move_uploads_up' ] as $fn ) {
	if ( preg_match( '/\nfunction ' . $fn . '\b.*?\n}\n/s', $src, $m ) ) {
		eval( $m[0] );
	} else {
		fwrite( STDERR, "could not extract $fn\n" );
		exit( 1 );
	}
}

$tests = 0; $fails = 0;
function ok( $what, $cond, $detail = '' ) {
	global $tests, $fails; $tests++;
	if ( $cond ) { echo "PASS  $what\n"; }
	else { $fails++; echo "FAIL  $what" . ( $detail ? " — $detail" : '' ) . "\n"; }
}

function reset_tree() {
	global $ROOT;
	foreach ( glob( "$ROOT/*" ) as $p ) {
		if ( is_dir( $p ) ) { array_map( 'unlink', glob( "$p/*" ) ); @rmdir( $p ); }
		else { unlink( $p ); }
	}
}

// --- the normal case: zip extracted into media/ ---------------------------
reset_tree();
mkdir( "$ROOT/media" );
foreach ( range( 1, 12 ) as $i ) { file_put_contents( "$ROOT/media/img$i.webp", 'x' ); }
file_put_contents( "$ROOT/media/notes.txt", 'x' );   // wrong type, must stay

$mis = ap_misplaced_uploads();
ok( 'detects the misplaced folder', isset( $mis['media'] ) && 12 === $mis['media'], json_encode( $mis ) );

$r = ap_move_uploads_up( 'media' );
ok( 'moved every media file', 12 === $r['moved'], json_encode( $r ) );
ok( 'files now in uploads root', file_exists( "$ROOT/img1.webp" ) );
ok( 'non-media file left behind', file_exists( "$ROOT/media/notes.txt" ) );
ok( 'folder kept because it is not empty', is_dir( "$ROOT/media" ) );

// --- a name collision must not overwrite ----------------------------------
reset_tree();
mkdir( "$ROOT/media" );
file_put_contents( "$ROOT/keep.webp", 'ORIGINAL' );
file_put_contents( "$ROOT/media/keep.webp", 'INCOMING' );
foreach ( range( 1, 6 ) as $i ) { file_put_contents( "$ROOT/media/o$i.webp", 'x' ); }

$r = ap_move_uploads_up( 'media' );
ok( 'collision skipped, not overwritten',
	'ORIGINAL' === file_get_contents( "$ROOT/keep.webp" ) && 1 === $r['skipped'],
	json_encode( $r ) );

// --- empty folder gets tidied up ------------------------------------------
reset_tree();
mkdir( "$ROOT/media" );
foreach ( range( 1, 8 ) as $i ) { file_put_contents( "$ROOT/media/c$i.png", 'x' ); }
ap_move_uploads_up( 'media' );
ok( 'empty folder removed afterwards', ! is_dir( "$ROOT/media" ) );

// --- protected folders -----------------------------------------------------
reset_tree();
mkdir( "$ROOT/elementor" );
foreach ( range( 1, 9 ) as $i ) { file_put_contents( "$ROOT/elementor/e$i.png", 'x' ); }
$mis = ap_misplaced_uploads();
ok( 'elementor folder is not offered', ! isset( $mis['elementor'] ), json_encode( $mis ) );
$r = ap_move_uploads_up( 'elementor' );
ok( 'refuses to move elementor', 0 === $r['moved'] && $r['errors'] );
ok( 'elementor files untouched', file_exists( "$ROOT/elementor/e1.png" ) );

reset_tree();
mkdir( "$ROOT/2026" );
foreach ( range( 1, 9 ) as $i ) { file_put_contents( "$ROOT/2026/y$i.jpg", 'x' ); }
$mis = ap_misplaced_uploads();
ok( 'WordPress year folder is not offered', ! isset( $mis['2026'] ), json_encode( $mis ) );

// --- path traversal --------------------------------------------------------
reset_tree();
mkdir( "$ROOT/media" );
file_put_contents( "$ROOT/media/t.webp", 'x' );
$r = ap_move_uploads_up( '../../../etc' );
ok( 'traversal attempt moves nothing', 0 === $r['moved'], json_encode( $r ) );

// --- small folders are ignored (avoids grabbing a stray pair of files) -----
reset_tree();
mkdir( "$ROOT/random" );
foreach ( range( 1, 3 ) as $i ) { file_put_contents( "$ROOT/random/r$i.png", 'x' ); }
$mis = ap_misplaced_uploads();
ok( 'tiny folder not flagged as misplaced media', ! isset( $mis['random'] ), json_encode( $mis ) );

reset_tree();
@rmdir( $ROOT );

echo "\n" . ( $tests - $fails ) . "/$tests passed\n";
exit( $fails ? 1 : 0 );
