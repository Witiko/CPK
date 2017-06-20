<?php
namespace CPK\RecordDriver;

use CPK\RecordDriver\SolrMarc as ParentSolrMarc;
use VuFind\RecordDriver\Response;
use Exception;

class SolrLibrary extends ParentSolrMarc
{
    private $searchController = null;
    private $searchRunner = null;

    public function __construct($mainConfig = null, $recordConfig = null,
                                $searchSettings = null, $searchController = null, $searchRunner = null
    ) {
        $this->searchController = $searchController;
        $this->searchRunner = $searchRunner;
        parent::__construct($mainConfig, $recordConfig, $searchSettings);
    }




    public function getParentRecordID()
    {
        return isset($this->fields['id']) ? $this->fields['id'] : [];
    }



    /**
     * Get an array of note about the libraryname
     *
     * @return array
     */
    public function getLibraryNames()
    {
        return isset($this->fields['name_display']) ? $this->fields['name_display'] : [];
    }

    /**
     * Get an array of note about the libraryhours
     *
     * @return array
     */
    public function getLibraryHours()
    {
        return isset($this->fields['hours_display']) ? $this->fields['hours_display'] : [];
    }

    /**
     * Get an array of note about the libraryhours
     *
     * @return array
     */
    public function getLibraryHoursArray()
    {
        $string = isset($this->fields['hours_display']) ? $this->fields['hours_display'] : [];
        $days = explode("|", $string);
        $result = array();
        foreach ($days as $day)
        {
            $parts = explode(" ", trim($day),2);
            $result[$parts[0]] = $parts[1];
        }
        return $result;
    }

    /**
     * Get an array of note about the
     *
     * @return array
     */
    public function getLastUpdated()
    {
        return isset($this->fields['lastupdated_str']) ? $this->fields['lastupdated_str'] : [];
    }



    /**
     * Get an array of note about the libraryname
     *
     * @return array
     */
    public function getLibraryAddress()
    {
        return isset($this->fields['address_display_mv']) ? $this->fields['address_display_mv'] : [];
    }


    /**
     * Get an array of library ico and dicn
     *
     * @return array
     */
    public function getIco()
    {
        return isset($this->fields['ico_display']) ? $this->fields['ico_display'] :'';
    }

    /**
     * Get an array of library ico and dicn
     *
     * @return array
     */
    public function getLibNote()
    {
        return isset($this->fields['note_display']) ? $this->fields['note_display'] :'';
    }


    /**
     *
     * @return array
     */
    public function getLibNote2()
    {
        return isset($this->fields['note2_display']) ? $this->fields['note2_display'] :'';
    }

    /**
     *
     * @return array
     */
    public function getSigla()
    {
        return isset($this->fields['sigla_display']) ? $this->fields['sigla_display'] :'';
    }

    /**
     *
     * @return array
     */
    public function getLibType()
    {
        return isset($this->fields['type_display']) ? $this->fields['type_display'] :'';
    }

    /**
     *
     * @return array
     */
    public function getLibUrl()
    {

        return isset($this->fields['url_display_mv']) ? $this->fields['url_display_mv'] :'';
    }


    /**
     *
     * @return array
     */
    public function getMvsNote()
    {
        return isset($this->fields['mvs_display_mv']) ? $this->fields['mvs_display_mv'] :[];
    }

    /**
     *
     * @return array
     */
    public function getLibBranch()
    {
        return isset($this->fields['branch_display_mv']) ? $this->fields['branch_display_mv'] :'';
    }

    /**
     *
     * @return array
     */
    public function getLibNameAlt()
    {
        return isset($this->fields['name_alt_display_mv']) ? $this->fields['name_alt_display_mv'] :'';
    }

    /**
     *
     * @return array
     */
    public function getLibResponsibility()
    {
        return isset($this->fields['responsibility_display_mv']) ? $this->fields['responsibility_display_mv'] :'';
    }

    /**
     *
     * @return array
     */
    public function getPhone()
    {
        return isset($this->fields['phone_display_mv']) ? $this->fields['phone_display_mv'] :'';
    }

    /**
     *
     * @return array
     */
    public function getEmail()
    {
        return isset($this->fields['email_display_mv']) ? $this->fields['email_display_mv'] :'';
    }

    /**
     *
     * @return array
     */
    public function getFax()
    {
        return isset($this->fields['fax_display_mv']) ? $this->fields['fax_display_mv'] :'';
    }

    /**
     *
     * @return array
     */
    public function getService()
    {
        return isset($this->fields['services_display_mv']) ? $this->fields['services_display_mv'] :'';

    }

    /**
     *
     * @return array
     */
    public function getFunction()
    {
        return isset($this->fields['function_display_mv']) ? $this->fields['function_display_mv'] :'';
    }

    /**
     *
     * @return array
     */
    public function getProject()
    {
        return isset($this->fields['projects_display_mv']) ? $this->fields['projects_display_mv'] :'';
    }


    public function getGps()
    {
        return isset($this->fields['gps_str']) ? $this->fields['gps_str'] : '';
    }




}

