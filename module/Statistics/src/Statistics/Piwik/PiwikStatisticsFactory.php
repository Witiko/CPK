<?php
namespace Statistics\Piwik;

use Zend\ServiceManager\ServiceManager;
use Statistics\Piwik\PiwikStatistics;
use Zend\ServiceManager\FactoryInterface;
use Zend\ServiceManager\ServiceLocatorInterface;

/**
 * Factory for PiwikStatistics
 * 
 * @author   Martin Kravec	<kravec@mzk.cz>
 */
class PiwikStatisticsFactory
{
	/**
	 * Construct the Statistics
	 *
	 * @param ServiceManager $sm Service manager.
	 *
	 * @return Statistics\Statistics\PiwikStatistics
	 */
	public static function getPiwikStatistics(ServiceManager $sm)
	{
		$config = $sm->get('VuFind\Config')->get('config');
		
		$multibackend = $sm->get('VuFind\Config')->get('shibboleth');
		$drivers = $multibackend->toArray();
		unset($drivers['main']);
		unset($drivers['default']);

		return new PiwikStatistics($config, array_keys($drivers));
	}
}