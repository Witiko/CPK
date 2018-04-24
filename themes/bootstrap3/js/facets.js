    /**
     * odkaz pres prave tlacitko udelam tak e po kliknuti pravim tlacitkem na li se vzgeneruje odkaz ktery "prekryje" dany li element
     */

    /**
     * pri klasickem kliknuti na facetu se vyvola lisener ktery bude vedet od ktere facety to vzeslo a na zaklade toho udela url a posle searchovi...ten nasledne pouze obnovi result
     * paralerne s tim se pomoci js zaklikne dana faceta a behem vyhledavani se facety zakazi aspon na klik... nebo si muze pamatovat na co bylo kliknuto
     * ale az po nacteni resultu se bude moct toto kliknuti behem zakazanych facet vyvola z duvodu ze nevime zda jestli vubec diky predeslemu vyhledavani bude mozne na tuto facetu kliknout
     */


    /**
     * vygenerovat vsechny nacteny facety ale pak urcit kolik jich zobrazit + ktery nechat otevreny defaultne
     */





function generateFacets(facets, label) {
    console.log(facets);
    var html = '';
    var create;
    var classFacet;
    html += '<li class="list-group-item title" id="facet-'+label+'">'+label+'</li>';
    html += '<ul id="facet-ul-'+label+'">';
    toHTML(html, 'side-panel-'+label);
    html = '';
    for (var i = 0; i < facets.length; i++) {
        if ((facets[i].operator === 'OR') && (parseInt(facets[i].value[0]) >= 0)) { // OR facet hierarchical
            if (parseInt(facets[i].value[0]) === 0) { // prvni uroven urcite nema rodice... nepocitame-li nadfacetovou uroven
                classFacet = createClass(cutter(facets[i].value));
                html += '<li class="list-group-item"  style="color: blue" id="facet-'+classFacet+'">'+facets[i].displayText+'</li>';
                if (checkChildren(facets, facets[i].value)) {
                    html += '<ul id="facet-ul-'+classFacet+'"></ul>';
                }
                toHTML(html, 'facet-ul-'+label);
                html = '';
            } else { // urcite bude mit nejakeho rodice
                //createHierarchy(facets, i);
                //console.log(create);
                //toHTML(create[html], create[id]);
                html = '';
            }
        } else if (facets[i].operator === 'OR') { // OR facets non-hierarchical
            html += '<li class="list-group-item" style="color: red">'+facets[i].displayText+'</li>';
            toHTML(html, 'facet-ul-'+label);
            html = '';
        } else { // AND facets
            html += '<li class="list-group-item">'+facets[i].displayText+'</li>';
            toHTML(html, 'facet-ul-'+label);
            html = '';
        }
    }
    html += '</ul>';
    toHTML(html, 'side-panel-'+label);
}

function createHierarchy(facets, facetID) {
    var facetValue = cutter(facets[facetID].value);

    var html ='';
    var mainParent = 'facet-ul-'+createMainParent(facets, facetID);
    //console.log(mainParent);
    var facetClass = 'facet-'+createClass(facetValue);
    //console.log(facetClass);


    //html += '<li class="list-group-item" style="color: blue" id="facet-'+facetClass+'">'+facets[facetID].displayText+'</li>';


    //console.log(facetValue);
    var zbytek = facetValue;
    zbytek = zbytek.slice(2);
    //console.log(zbytek);

    //console.log(facetValue);

    while (!existClass(mainParent)) {
        zbytek = zbytek.slice(0,1);
        mainParent = findChildren(mainParent, zbytek);
    }


    var parent = mainParent;
    while (parent !== facetClass) {
        var num = checkParent(facets, parent, facetClass);
        html += '<li class="list-group-item"  style="color: blue" id="'+num+'">'+'asdasdddd'+'</li>';
        /*if (!existClass(parent)) {
            parent = mainParent;
        }*/
        toHTML(html, parent);
        parent = num;
        parent = parent.split('-');
        parent.splice(1,1);
        var cislo = parseInt(parent[1])+1;
        parent.splice(1,1,cislo.toString());
        parent = parent.join('-');
        console.log(parent);
        console.log(facetClass);
    }
    console.log(mainParent);
    html += '<li class="list-group-item"  style="color: blue" id="'+num+'">'+'asdasdddd'+'</li>';
    toHTML(html, mainParent);

    //console.log(mainParent);
    //console.log(facetClass);

    // ted se musi vytvorit hierarchye od mainParent po facetValue

    //console.log(mainParent);
    // first class bude kntrolovat od nejvzssi urovne po nejniysi a ay najde prvni ktera uz neexistuje tak ji nastavi na first class
    /*return {
        html: html,
        id: firstClass
    };*/
}

function checkParent(facets, parent, facetClass) {
    facetClass = facetClass.split('-');
    facetClass.splice(0,3);
    //console.log(facetClass);
    parent = parent.split('-');
    var searched = parent.concat(facetClass.slice(0,1));
    //var cislo = parseInt(searched[2])+1;
    //console.log(parseInt(searched[2])+1);
    //searched.splice(2,1,cislo.toString());
    searched = searched.join('-');
    console.log(searched);


    return searched;
}

function checkChildren(facets, facetValue) {
    facetValue = cutter(facetValue);
    var cislo = parseInt(facetValue[0])+1;
    facetValue.splice(0,1,cislo.toString());
    console.log(facetValue);
    for (var i = 0; i < facets.length; i++) {
        var value = cutter(facets[i].value);
        value = value.slice(0,2);
        console.log(value);
        var stejne = true;
        for (var l = 0; l < value.length; l++) {
            if (facetValue[l] !== value[l]){
                stejne = false;
            }
        }
        if (stejne) {
            return true;
        }
    }
    return false;
}

function createMainParent(facets, facetID) {
    var facetValue = cutter(facets[facetID].value);
    facetValue.splice(0,1,'0');
    facetValue = facetValue.slice(0,2);
    facetValue = createClass(facetValue);
    //console.log(facetValue);
    return facetValue;
}

function findChildren(mainParent, zbytek) {
    mainParent = mainParent.split('-');
    var cislo = parseInt(mainParent[2])+1;
    mainParent.splice(2,1,cislo.toString());
    console.log(mainParent);
    console.log(zbytek);
    var konec = mainParent.concat(zbytek);
    konec = konec.join('-');
    //console.log(konec);
    return konec;
}

function existClass(className) {
    if (document.getElementById(className)){
        return true;
    } else {
        return false;
    }
}




function facetLevel(facetValue) {
    return facetValue[0];
}

function facetSection(facetValue) {
    //console.log(facetValue.length - 1);
    return facetValue[facetValue.length - 1];
}

function createClass(facetValue) {
    var facetClass = facetValue;
    //console.log(facetClass);
    facetClass.slice(0,-1);
    //console.log(facetClass);
    facetClass = facetClass.join('-');
    return facetClass;
}

function cutter(facetValue) {
    facetValue = facetValue.split('/');
    facetValue = facetValue.slice(0, -1);
    return facetValue;
}

function toHTML(html, id) {
    document.getElementById(id).innerHTML += html;
}

function fromHTML(id) {
    return document.getElementById(id).innerHTML;
}



jQuery( document ).ready( function( $ ) {

	/*
	 * Save chosen institutions to DB
	 */
	$( 'body' ).on( 'click', '#save-these-institutions', function( event ) {
		event.preventDefault();

		var data = {};
		var institutions = [];

        var selectedInstitutions = $('#facet_institution').jstree(true).get_bottom_selected();
        $.each( selectedInstitutions, function( index, value ){
            var explodedArray = value.split(":");
            institutions.push(explodedArray[1].slice(1, -1));
        });

		data['institutions'] = institutions;

		$.ajax({
        	type: 'POST',
        	cache: false,
        	dataType: 'json',
        	url: VuFind.getPath() + '/AJAX/JSON?method=saveTheseInstitutions',
        	data: data,
        	beforeSend: function() {
        	},
        	success: function( response ) {
        		console.log( 'Save these institutions: ' );
        		console.log( data );
        		if (response.status == 'OK') {

        			$( '#save-these-institutions-confirmation' ).modal( 'show' );

        			setTimeout( function() {
        				$( '#save-these-institutions-confirmation' ).modal( 'hide' );
        			}, 1200 );

        		} else {
        			console.error(response.data);
        		}

         	},
            error: function ( xmlHttpRequest, status, error ) {
            	$( '#search-results-loader' ).remove();
            	console.error(xmlHttpRequest.responseText);
            	console.error(xmlHttpRequest);
            	console.error(status);
            	console.error(error);
            },
            complete: function ( xmlHttpRequest, textStatus ) {
            }
        });

	});

    /*
     * Load saved institutions from db
     */
    $( 'body' ).on( 'click', '#load-saved-institutions', function( event ) {
        event.preventDefault();

        $.ajax({
            type: 'POST',
            cache: false,
            dataType: 'json',
            url: VuFind.getPath() + '/AJAX/JSON?method=getSavedInstitutions',
            beforeSend: function() {
            },
            success: function( response ) {
                console.log( 'Save these institutions: ' );
                console.log( response );
                if (response.status == 'OK') {
                    $('#facet_institution').jstree(true).deselect_all();

                    var csvInstitutions = response.data.savedInstitutions;

                    var arrayInstitutions = csvInstitutions.split(";");


                    $.each( arrayInstitutions, function( index, value ){
                        var institution = '~local_institution_facet_str_mv:"' + value + '"';
                        $('#facet_institution').jstree(true).select_node(institution);

                    });

                    $( "input[name='page']" ).val( '1' );

                    //remove all institutions
                    var allInstitutions = $('#facet_institution').jstree(true).get_json('#', {flat:true});
                    $.each( allInstitutions, function( index, value ){
                        ADVSEARCH.removeFacetFilter( value['id'], false );
                    });

                    //add selected institutions
                    var selectedInstitutions = $('#facet_institution').jstree(true).get_bottom_selected();
                    $.each( selectedInstitutions, function( index, value ){
                        ADVSEARCH.addFacetFilter( value, false );
                    });
                    ADVSEARCH.updateSearchResults( undefined, undefined );

                } else {
                    console.error(response.data);
                }

            },
            error: function ( xmlHttpRequest, status, error ) {
                $( '#search-results-loader' ).remove();
                console.error(xmlHttpRequest.responseText);
                console.error(xmlHttpRequest);
                console.error(status);
                console.error(error);
            },
            complete: function ( xmlHttpRequest, textStatus ) {
            }
        });

    });
    
    /*
     * Load my institutions from HTML container
     */
    $( 'body' ).on( 'click', '#load-my-institutions', function( event ) {
        event.preventDefault();
        
        var data = $( '#my-libraries-container' ).text();
        console.log('Loading my libraries: ');
        console.log( data  );

        $('#facet_institution').jstree(true).deselect_all();

        var arrayInstitutions = data.split(";");

        $.each( arrayInstitutions, function( index, value ){
            var institution = '~local_institution_facet_str_mv:"' + value + '"';
            $('#facet_institution').jstree(true).select_node(institution);

        });

        $( "input[name='page']" ).val( '1' );

        //remove all institutions
        var allInstitutions = $('#facet_institution').jstree(true).get_json('#', {flat:true});
        $.each( allInstitutions, function( index, value ){
            ADVSEARCH.removeFacetFilter( value['id'], false );
        });

        //add selected institutions
        var selectedInstitutions = $('#facet_institution').jstree(true).get_bottom_selected();
        $.each( selectedInstitutions, function( index, value ){
            ADVSEARCH.addFacetFilter( value, false );
        });
        ADVSEARCH.updateSearchResults( undefined, undefined );

    });
    
    /*
     * Load nearest institutions from HTML container
     */
    $( 'body' ).on( 'click', '#load-nearest-institutions', function( event ) {
        event.preventDefault();
        
        GEO.getPositionForLoadingInstitutions();
    });
    
    /*
     * Shake button on institution facet change
     */
    $( 'body' ).on( 'click', '#facet_institution .jstree-anchor', function( event ) {
        if (localStorage['facetsApplied']) {
            localStorage.setItem("facetsApplied", parseInt(parseInt(localStorage.getItem("facetsApplied")) + 1));
        }
        if ( $( '.institution-facet-filter-button' ).visible( true ) ) {
            $('.institution-facet-filter-button').parent().effect('shake', {
                times: 3,
                distance: 3,
                direction: 'right'
            }, 200);
        } else {
            if ($(".bootstrap-growl").length === 0) {
                var isMobile = false; //initiate as false
                // device detection
                if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
                    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) isMobile = true;

                if (isMobile == false) {
                    $.bootstrapGrowl(VuFind.translate('Do not forget to update search results'), // Messages
                        { // options
                            type: "info", // info, success, warning and danger
                            ele: "body", // parent container
                            offset: {
                                from: "bottom",
                                amount: 40
                            },
                            align: "left", // right, left or center
                            width: 300,
                            delay: 4000,
                            allow_dismiss: false, // add a close button to the message
                            stackup_spacing: 10
                        });
                }
            }
        }
    });
    
    FACETS = {
    			
		reloadInstitutionsByGeolocation: function( coords ) {
			console.log( 'Loading position... Coords: ' );
			console.log( coords );
			
			$.ajax({
	            type: 'POST',
	            cache: false,
	            dataType: 'json',
	            data: coords,
	            url: VuFind.getPath() + '/AJAX/JSON?method=getTownsByRegion',
	            beforeSend: function() {
	            },
	            success: function( response ) {

	                if (response.status == 'OK') {
		                console.log( 'STATUS: OK ' );
		                //console.log( response );
		                console.log( 'My region is:' );
		                console.log( response.data.region );
		                
		                $('#facet_institution').jstree(true).deselect_all();
		                
		                $.each( response.data.towns, function( key, value ) {
		                	var townFacet = '~local_institution_facet_str_mv:"1/Library/'+value.town.toLowerCase()+'/"';
		                	$('#facet_institution').jstree(true).select_node(townFacet);
	                	});
		                
		                $( "input[name='page']" ).val( '1' );

		                //remove all institutions
		                var allInstitutions = $('#facet_institution').jstree(true).get_json('#', {flat:true});
		                $.each( allInstitutions, function( index, value ){
		                    ADVSEARCH.removeFacetFilter( value['id'], false );
		                });

		                //add selected institutions
		                var selectedInstitutions = $('#facet_institution').jstree(true).get_bottom_selected();
		                $.each( selectedInstitutions, function( index, value ){
		                    ADVSEARCH.addFacetFilter( value, false );
		                });
		                ADVSEARCH.updateSearchResults( undefined, undefined );
		                
	                } else {
	                    console.error(response.data);
	                }

	            },
	            error: function ( xmlHttpRequest, status, error ) {
	                $( '#search-results-loader' ).remove();
	                console.error(xmlHttpRequest.responseText);
	                console.error(xmlHttpRequest);
	                console.error(status);
	                console.error(error);
	            },
	            complete: function ( xmlHttpRequest, textStatus ) {
	            }
	        });
		}
		
	};
    	

});

var replaceAll = function ( str, find, replace ) {
	  return str.replace( new RegExp( (find+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&") , 'g' ), replace );
};

/**
 * This functions is used like standard php's urlencode,
 * but insted of double encode, this creates url friedly string for
 * base64 encoding/decoding.
 *
 * @param   {string } input
 *
 * @return  {string}
 */
var specialUrlEncode = function( input ) {
	if ( typeof input[0] == 'undefined' || input[0] == null || !input ) {
		return '';
	}
	var output = replaceAll( input, '+', '-' );
	output = replaceAll( output, '/', '_' );
	output = replaceAll( output, '=', '.' );
	return output;
};

/**
 * This functions is used like standard php's urldecode,
 * but insted of double decode, this creates url friedly string for
 * base64 encoding/decoding.
 *
 * @param   {string } input
 *
 * @return  {string}
 */
var specialUrlDecode = function( input ) {
	if ( typeof input[0] == 'undefined' || input[0] == null || !input ) {
		return '';
	}
	var output = replaceAll( input, '-', '+' );
	output = replaceAll( output, '_', '/' );
	output = replaceAll( output, '.', '=' );
	return output;
};
