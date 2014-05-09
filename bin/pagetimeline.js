#!/usr/bin/env node
/**
 * PhantomAS-based and timeline-based web performance metrics collector
 *
 * Run "node pagetimeline.js" to get help
 *
 * @see https://github.com/fex/pagetimeline
 */
var phantomas = require('phantomas'),
    timeline = require('./../lib/timeline'),
	program = require('optimist'),
    os = require('os'),
	phantomasChild,
    phantomasRes,
    timelineChild,
    timelineRes,
	options = {},
	program,
    count=0,
    total= 2,
	url = '';

// parse options
program
	.usage('pagetimeline --url <url> [options]')

	// mandatory
	.describe('url', 'Set URL to work with').string('url')

	// version / help
	.describe('version', 'Show version number and quit').boolean('version').alias('version', 'V')
	.describe('help', 'This help text').boolean('help').alias('help', 'h')

	// optional params
	.describe('allow-domain', 'allow requests to given domain(s) - aka whitelist [domain],[domain],...')
	.describe('block-domain', 'disallow requests to given domain(s) - aka blacklist [domain],[domain],...')
	.describe('config', 'uses JSON-formatted config file to set parameters')
	.describe('cookie', 'document.cookie formatted string for setting a single cookie (e.g. "bar=foo;domain=url")')
	.describe('cookies-file', 'specifies the file name to store the persistent Cookies')
	.describe('disable-js', 'disable JavaScript on the page that will be loaded').boolean('disable-js')
	.describe('format', 'output format').default('format', 'plain')
	.describe('ignore-ssl-errors', 'ignores SSL errors, such as expired or self-signed certificate errors')
	.describe('log', 'log to a given file')
	.describe('modules', 'run selected modules only [moduleOne],[moduleTwo],...')
	.describe('no-externals', 'block requests to 3rd party domains').boolean('no-externals')
	.describe('post-load-delay', 'wait X seconds before generating a report')
	.describe('proxy', 'specifies the proxy server to use (e.g. --proxy=192.168.1.42:8080)')
	.describe('proxy-auth', 'specifies the authentication information for the proxy (e.g. --proxy-auth=username:password)')
	.describe('proxy-type', 'specifies the type of the proxy server [http|socks5|none]')
	.describe('screenshot', 'render fully loaded page to a given file')
	.describe('silent', 'don\'t write anything to the console').boolean('silent')
	.describe('skip-modules', 'skip selected modules [moduleOne],[moduleTwo],...')
	.describe('timeout', 'timeout for phantomas run').default('timeout', 15)
	.describe('user-agent', 'provide a custom user agent')
	.describe('verbose', 'writes debug messages to the console').boolean('verbose').alias('verbose', 'v')
	.describe('viewport', 'phantomJS viewport dimensions [width]x[height]').default('viewport', '1280x1024')
	.describe('wait-for-selector', 'wait for an element matching given CSS selector before generating a report')

	// experimental features
	.describe('analyze-css', 'emit in-depth CSS metrics - EXPERIMENTAL').boolean('analyze-css')
	.describe('film-strip', 'register film strip when page is loading - EXPERIMENTAL').boolean('film-strip')
	.describe('film-strip-dir', 'folder path to output film strip (default is ./filmstrip directory) - EXPERIMENTAL');

// parse it
options = program.parse(process.argv);

// show version number
if (options.version === true) {
	console.log('pagetimeline v%s', timeline.version);
	process.exit(0);
}

// show help
if (options.help === true) {
	program.showHelp();
	process.exit(0);
}

// --url is mandatory -> show help
if (typeof options.url !== 'string' && typeof options.config === 'undefined') {
	program.showHelp();
	process.exit(255);
}

url = options.url;
delete options.url;
delete options._;
delete options.$0;

// handle --no-foo options
options['no-externals'] = options.externals === false;
delete options.externals;

timelineChild = timeline(url,options);

timelineChild.on('error',function(code){
    console.log('error');
    normalExit();
});

/*
timelineChild.on('results',function(res){
    printTitle();

    process.stdout.write( new Buffer( res.getMetrics() ) );
    console.log( res.getMetrics() );
    console.log( res.getAllOffenders() );
    process.stdout.write(new Buffer( res ) );
});
*/

timelineChild.on('report',function(res){
    printTitle();
    process.stdout.write( new Buffer( res ) );
    normalExit();
});

// spawn phantomas process
phantomasChild = phantomas(url, options);

// pass raw results
phantomasChild.on('results', function (res) {
    console.log( res.getMetrics() );
    //process.stdout.write( new Buffer( res ) );
    normalExit();
});

// pass exit code
phantomasChild.on('error', function (code) {
	process.exit(code);
});

function getTitle(){
    var moduleName = require('../package').name;
    var version = require('../package').version;
    return moduleName + ' ' + version + ':\r\n';
}

function printTitle(){
    if( count++ == 0 ){
        process.stdout.write( getTitle() );
    }
}

function normalExit(){
    if( count == total) process.exit(0);
}
