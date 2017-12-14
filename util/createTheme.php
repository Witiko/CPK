<?php
/*
 * slouzi jako propojeni config.ini a variables.less
 * v pripade ze bude nutno v lessu pomoci config.ini menit neo jineho nez jen barva, je potreba to rucne dopsat vzorem jako je ro defaultni barvu
 */

$theme = parse_ini_file("../local/config/vufind/config.ini");

$clr = $theme['color'];

$myfile = fopen("../themes/bootstrap3/less/theme.less", "w");
fwrite($myfile, "@myClr: ".$clr.";");
fclose($myfile);