<?php
use Zend\Loader\AutoloaderFactory;
use Zend\ServiceManager\ServiceManager;
use Zend\Mvc\Service\ServiceManagerConfig;

// If the XHProf profiler is enabled, set it up now:
$xhprof = getenv('VUFIND_PROFILER_XHPROF');
if (!empty($xhprof) && extension_loaded('xhprof')) {
    xhprof_enable();
} else {
    $xhprof = false;
}

// Define path to application directory
defined('APPLICATION_PATH')
    || define(
        'APPLICATION_PATH',
        (getenv('VUFIND_APPLICATION_PATH') ? getenv('VUFIND_APPLICATION_PATH')
            : dirname(__DIR__))
    );

// Define application environment
defined('APPLICATION_ENV')
    || define(
        'APPLICATION_ENV',
        (getenv('VUFIND_ENV') ? getenv('VUFIND_ENV') : 'production')
    );

// Define default search backend identifier
defined('DEFAULT_SEARCH_BACKEND') || define('DEFAULT_SEARCH_BACKEND', 'Solr');

// Define path to local override directory
defined('LOCAL_OVERRIDE_DIR')
    || define(
        'LOCAL_OVERRIDE_DIR',
        (getenv('VUFIND_LOCAL_DIR') ? getenv('VUFIND_LOCAL_DIR') : '')
    );

// Define path to cache directory
defined('LOCAL_CACHE_DIR')
    || define(
        'LOCAL_CACHE_DIR',
        (getenv('VUFIND_CACHE_DIR')
            ? getenv('VUFIND_CACHE_DIR')
            : (strlen(LOCAL_OVERRIDE_DIR) > 0 ? LOCAL_OVERRIDE_DIR . '/cache' : ''))
    );

// Save original working directory in case we need to remember our context, then
// switch to the application directory for convenience:
define('ORIGINAL_WORKING_DIRECTORY', getcwd());
chdir(APPLICATION_PATH);

// Ensure vendor/ is on include_path; some PEAR components may not load correctly
// otherwise (i.e. File_MARC may cause a "Cannot redeclare class" error by pulling
// from the shared PEAR directory instead of the local copy):
$pathParts = array();
$pathParts[] = APPLICATION_PATH . '/vendor';
$pathParts[] = get_include_path();
set_include_path(implode(PATH_SEPARATOR, $pathParts));

// Composer autoloading
if (file_exists('vendor/autoload.php')) {
    $loader = include 'vendor/autoload.php';
}

// Support for ZF2_PATH environment variable
if ($zf2Path = getenv('ZF2_PATH')) {
    if (isset($loader)) {
        $loader->add('Zend', $zf2Path . '/Zend');
    } else {
        include $zf2Path . '/Zend/Loader/AutoloaderFactory.php';
        AutoloaderFactory::factory();
    }
}

if (!class_exists('Zend\Loader\AutoloaderFactory')) {
    throw new RuntimeException('Unable to load ZF2.');
}

$cpkFunction = __DIR__ . '/cpk-functions.php';

if (file_exists($cpkFunction)) {
    require_once($cpkFunction);
}

if (! (php_sapi_name() != 'cli' OR defined('STDIN') || (is_numeric($_SERVER['argc']) && $_SERVER['argc'] > 0))) {
    if (isset($_SERVER['VUFIND_ENV'])) {
        if ($_SERVER['VUFIND_ENV'] == 'production') {
            error_reporting(E_ALL); // Report all PHP errors
            ini_set("display_errors", 0);
        } else if ($_SERVER['VUFIND_ENV'] == 'development') { // DEVELOPMENT
            error_reporting(E_ALL); // Report all PHP errors
            ini_set('display_startup_errors', 1);
            ini_set("display_errors", 1);
        } else {
            exit('Variable VUFIND_ENV has strange value in Apache config! [Ignore this message when in CLI]');
        }
    } else {
        exit('Variable VUFIND_ENV is not set in Apache config! [Ignore this message when in CLI]');
    }
}



//set own error end exception handlers (cpk-functions.php)
set_error_handler('cpkErrorHandler');
set_exception_handler('cpkExceptionHandler');

//Init Sentry
if (isset($_SERVER['SENTRY_SECRET_ID'])) {
    $sentryClient = new \Raven_Client('https://'.$_SERVER['SENTRY_SECRET_ID'].'@sentry.io/149541');
    $error_handler = new \Raven_ErrorHandler($sentryClient);
    $error_handler->registerExceptionHandler(true);
    $error_handler->registerErrorHandler(true, E_ALL);
    $error_handler->registerShutdownFunction();
}

// Run the application!
Zend\Mvc\Application::init(require 'config/application.config.php')->run();

// Handle final profiling details, if necessary:
if ($xhprof) {
    $xhprofData = xhprof_disable();
    include_once "xhprof_lib/utils/xhprof_lib.php";
    include_once "xhprof_lib/utils/xhprof_runs.php";
    $xhprofRuns = new XHProfRuns_Default();
    $suffix = 'vufind2';
    $xhprofRunId = $xhprofRuns->save_run($xhprofData, $suffix);
    $url = "$xhprof?run=$xhprofRunId&source=$suffix";
    echo "<a href='$url'>Profiler output</a>";
}