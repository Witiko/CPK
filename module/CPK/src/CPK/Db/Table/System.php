<?php
/**
 * Table Definition for System
 *
 * PHP version 5
 *
 * Copyright (C) Moravian Library 2015.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 * @category VuFind2
 * @package  Db_Table
 * @author   Martin Kravec <martin.kravec@mzk.cz>
 * @license  http://opensource.org/licenses/gpl-3.0.php GNU General Public License
 * @link     http://vufind.org   Main Site
 */
namespace CPK\Db\Table;

use CPK\Db\Table\Gateway,
    Zend\Config\Config,
    Zend\Db\Sql\Select,
    Zend\Db\Sql\Insert,
    Zend\Db\Sql\Update,
    Zend\Db\Sql\Delete;

/**
 * Table Definition for System
 *
 * @category VuFind2
 * @package  Db_Table
 * @author   Martin Kravec <martin.kravec@mzk.cz>
 * @license  http://opensource.org/licenses/gpl-3.0.php GNU General Public License
 * @link     http://vufind.org Main Site
 */
class System extends Gateway
{
    /**
     * @var \Zend\Config\Config
     */
    protected $config;

    /**
     * Constructor
     *
     * @param \Zend\Config\Config $config VuFind configuration
     *
     * @return void
     */
    public function __construct(Config $config)
    {
        $this->config = $config;
        parent::__construct('system', 'CPK\Db\Row\System');
    }

    /**
     * Returns amount of sent helps
     *
     * @return int
     */
    public function getAmountOfSentHelps()
    {
        $select = new Select($this->table);
        $select->where("`key`='SENT_HELPS'");
        $results = $this->executeAnyZendSQLSelect($select);

        $resultSet = new \Zend\Db\ResultSet\ResultSet();
        $resultSet->initialize($results);

        $resultSet = $resultSet->toArray();
        return (! empty($resultSet[0]['value'])) ? $resultSet[0]['value'] : 0;
    }

    /**
     * Sets amount of sent helps
     *
     * @param   int $amount
     */
    public function setAmountOfSentHelps($amount)
    {
        $update = new Update($this->table);
        $update->where("`key`='SENT_HELPS'");
        $update->set([
            'value' => $amount
        ]);

        $this->getDbConnection()->beginTransaction();
        $this->sql->prepareStatementForSqlObject($update)->execute();
        $this->getDbConnection()->commit();
    }
}