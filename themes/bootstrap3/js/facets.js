    /**
     * odkaz pres prave tlacitko udelam tak e po kliknuti pravim tlacitkem na li se vzgeneruje odkaz ktery "prekryje" dany li element
     */

    /**
     * pri klasickem kliknuti na facetu se vyvola lisener ktery bude vedet od ktere facety to vzeslo a na zaklade toho udela url a posle searchovi...ten nasledne pouze obnovi result
     * paralerne s tim se pomoci js zaklikne dana faceta a behem vyhledavani se facety zakazi aspon na klik... nebo si muze pamatovat na co bylo kliknuto
     * ale az po nacteni resultu se bude moct toto kliknuti behem zakazanych facet vyvola z duvodu ze nevime zda jestli vubec diky predeslemu vyhledavani bude mozne na tuto facetu kliknout
     */


/**
 * This function insert to HTML list of all facets
 *
 * @param facets    object of all facets
 * @param label     name of one section facet which will be generated
 * @param number    array of facets section where we want print results count
 */
function generateFacets(facets, label, number) {
    console.log(facets);
    var html = '';
    var facetId;
    var facetIdParent;
    var facetValue;
    var facetOperator;
    var facetText;
    label = transFacet(label);
    number = transAll(number);
    html += '<div class="col-xs-12 list-group" id="side-panel-'+label+'">';
    toHTML(html, 'side-facets-placeholder');
    html = '';
    html += '<li class="list-group-item title" id="facet-'+label+'"><span class="arrow" id="facet-'+label+'-ul">'+label+'</span></li>';
    html += '<ul id="facet-ul-'+label+'">';
    toHTML(html, 'side-panel-'+label);
    html = '';
    for (var i = 0; i < facets.length; i++) {
        facets[i].value = transFacet(facets[i].value); // translate some char to another char
    }
    for (var i = 0; i < facets.length; i++) {
        facetValue = facets[i].value;
        facetOperator = facets[i].operator;
        facetText = facets[i].displayText;
        if ((facetOperator === 'OR') && (parseInt(facetValue[0]) >= 0)) { // OR facet hierarchical
            if (facetValue[0] === '0') { // first level facet
                facetId = 'facet-'+label+'-'+createId(cutter(facetValue).slice(0, -1));
                if (checkChildren(facets, facetValue, i)) {
                    facetIdParent = createId(cutter(facetValue).slice(0, -1));
                    html += '<li class="list-group-item or-facet" id="'+facetId+'"><b class="arrow" id="'+facetId+'-ul"></b><span class="parent">'+facetText+'</span></li>';
                    html += '<ul class="ul-parent" id="facet-ul-'+label+'-'+facetIdParent+'"></ul>';
                } else {
                    html += '<li class="list-group-item or-facet" id="'+facetId+'"><span>'+facetText+'</span></li>';
                }
                toHTML(html, 'facet-ul-'+label);
            } else { // second or more level facet, always have some parent
                // spoliha se na to, ze v poli je nejdrive vyssi uroven a az pote nizsi uroven (podfaseta k yobrazena pod vyssi facetou)
                facetId = 'facet-'+label+'-'+createId(cutter(facetValue).slice(0, -1));

                var parent = label+'-'+createParent(facets, i);
                if (checkChildren(facets, facetValue, i)) {
                    // @TODO toto se jste nechova uplne spravne
                    facetIdParent = createId(cutter(facetValue).slice(0, -1));
                    html += '<li class="list-group-item or-facet facet-'+parent+'" id="'+facetId+'"><b class="arrow" id="'+facetId+'-ul"></b><span class="parent child">'+facetText+'</span></li>';
                    html += '<ul class="ul-parent facet-'+parent+'" id="facet-ul-'+label+'-'+facetIdParent+'"></ul>';
                } else {
                    html += '<li class="list-group-item or-facet '+'facet-'+parent+'" id="'+facetId+'"><span class="child">'+facetText+'</span></li>';
                }
                toHTML(html, 'facet-ul-'+parent);
            }
        } else if (facetOperator === 'OR') { // OR facet non-hierarchical
            facetId = 'facet-'+label+'-'+createId(cutter(facetValue));
            html += '<li class="list-group-item or-facet" id="'+facetId+'"><span>'+facetText+'</span></li>';
            toHTML(html, 'facet-ul-'+label);
        } else { // AND facet
            facetId = 'facet-'+label+'-'+createId(cutter(facetValue));
            html += '<li class="list-group-item and-facet" id="'+facetId+'"><span>'+facetText+'</span></li>';
            toHTML(html, 'facet-ul-'+label);
        }
        html = '';
        if (number.indexOf(label) !== -1) {
            html += '<b>'+facets[i].count+'</b>';
            toHTML(html, facetId);
            html = '';
        }
    }
    html += '</ul></div>';
    toHTML(html, 'side-panel-'+label);
}

/**
 * Replace some chars in string, as czech diacritic or special char
 *
 * @param str
 * @returns {string | *}
 */
function transFacet(str) {
    var accents    = 'ĚŠČŘŽÝÁÍÉěščřžýáíéŤťĎď.,-():';
    var accentsOut = "ESCRZYAIEescrzyaieTtDd______";
    str = str.split('');
    var strLen = str.length;
    var i, x;
    for (i = 0; i < strLen; i++) {
        if ((x = accents.indexOf(str[i])) !== -1) {
            str[i] = accentsOut[x];
        }
    }
    str = str.join('').split('_').join('').split(' ').join('');
    return str;
}

/**
 * Replace some chars in array, as czech diacritic or special char
 *
 * @param array
 * @returns {*}
 */
function transAll(array) {
    for (var i = 0; i < array.length; i++) {
        array[i] = transFacet(array[i]);
    }
    return array;
}


function checkChildren(facets, facetValue, pos) {
    facetValue = cutter(facetValue).slice(0, -1);
    var cislo = parseInt(facetValue[0])+1;
    facetValue.splice(0,1,cislo.toString());
    for (var i = pos; i < facets.length; i++) {
        var value = cutter(facets[i].value).slice(0, -1);
        value = value.slice(0,-1);
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

function createParent(facets, facetID) {
    var facetValue = cutter(facets[facetID].value).slice(0, -1);
    var cislo = parseInt(facetValue[0])-1;
    facetValue.splice(0,1,cislo.toString());
    facetValue = facetValue.slice(0,-1);
    facetValue = createId(facetValue);
    return facetValue;
}

function createId(facetValue) {
    var facetClass = facetValue;
    facetClass.slice(0,-1);
    facetClass = facetClass.join('-');
    return facetClass;
}

function cutter(facetValue) {
    facetValue = facetValue.split('/');
    return facetValue;
}

function toHTML(html, id) {
    document.getElementById(id).innerHTML += html;
}



var resultDef;

function setFacets(results, open, subOpen) {
    resultDef = results.default;
    open = transAll(open);
    subOpen = transAll(subOpen);
    $( "#side-facets-placeholder .list-group" ).children('ul').each(function() {
        $(this).addClass("hide");
        for (var i = 0; i < open.length; i++) {
            if (this.id.search(open[i]) >= 0) {
                $(this).removeClass("hide");
                $(this).children('ul').addClass("hide");
            }
        }
        $(this).children('li').slice(parseInt(results.default)).addClass("hide");

        if ($(this).children('ul li').size() > parseInt(results.default)) {
            $(this).children("li:nth-of-type("+$(this).children('ul li').size()+")").after( "<p class='new'>Zobrazit všechny</p>" );
        }
    });

    $( "#side-facets-placeholder .list-group ul" ).children('ul').each(function() {
        $(this).addClass("hide");
        for (var i = 0; i < subOpen.length; i++) {
            if (this.id.search(subOpen[i]) >= 0) {
                $(this).removeClass("hide");
                $(this).children('ul').addClass("hide");
            }
        }
    });

    $(".arrow").each(function(i, obj) {
        var sipka = obj.id;
        var idecko = sipka.split('-');
        idecko.splice(-1,1);
        idecko.splice(1,0,'ul');
        idecko = idecko.join('-');
        if (!$("#"+idecko).hasClass('hide')) {
            console.log('pokus');
            $('#'+sipka).addClass('active');
        }
    });
    console.log(results);
    console.log(open);
}

jQuery( document ).ready( function( $ ) {

    $( 'body' ).on( 'click', '.new', function( event ) {
        var pokus = "#"+event.target.parentNode.id;

        $( pokus ).children('li').each(function() {
            $(this).removeClass("hide");


        });
        $(event.target).addClass("hide");
        $( pokus ).append("<p class='old'>skryt vse</p>");
    });

    $( 'body' ).on( 'click', '.old', function( event ) {
        var pokus = "#"+event.target.parentNode.id;

        $(event.target).addClass("hide");
        $(pokus).children('li').slice(resultDef).addClass("hide");
        $(pokus+' .new').removeClass('hide');
    });


    $( 'body' ).on( 'click', '.arrow', function( event ) {
        var classArrow = event.target.id;
        classArrow = classArrow.split('-');
        classArrow = classArrow.slice(0, -1);
        classArrow.splice(1,0,'ul');
        classArrow = createId(classArrow);
        $('#'+classArrow).each(function() {
            $(this).toggleClass("hide");
        });
        $(event.target).toggleClass("active");
    });

    $( 'body' ).on( 'click', 'li.list-group-item.or-facet span', function( event ) {
        var parentId = event.target.closest('ul').id;
        parentId = parentId.split('-');
        parentId.splice(1,1);
        parentId = parentId.join('-');
        var childClass = event.target.parentNode.id;
        var tridy = event.target.className;
        tridy = tridy.split(' ');
        if (tridy.indexOf('parent') >= 0 || tridy.indexOf('child') >= 0) { // facet with hierarchy
            if (tridy.indexOf('active') >= 0) {
                if (tridy.indexOf('parent') >= 0) { // odklikava childy
                    $(event.target).removeClass('half-active');
                    $(event.target).removeClass('active');
                    childClass = '.' + childClass + ' span';
                    $(childClass).each(function () {
                        $(this).removeClass("active");
                        $(this).removeClass("half-active");
                    });
                }
                if (tridy.indexOf('child') >= 0) { // odklikava parenta
                    $(event.target).removeClass('active');
                    $(event.target).removeClass('half-active');
                    // @TODO neslo by neco ve stylu event.target.parents().hasClass(or-facet) ?????
                    while (parentId.match(/-/g).length >= 3) {
                        console.log(parentId.match(/-/g).length);
                        $('#' + parentId + ' span').each(function () {
                            $(this).removeClass("active");
                            if (!$('.' + parentId + ' span').hasClass('active')) {
                                $(this).removeClass("half-active");
                            }
                        });
                        parentId = parentId.split('-');
                        parentId.splice(-1,1);
                        var cislo = parseInt(parentId[2])-1;
                        parentId.splice(2,1,cislo.toString());
                        parentId = parentId.join('-');
                        console.log(parentId);
                    }
                }
            } else if (tridy.indexOf('half-active') >= 0) {
                $(event.target).addClass('active');
                if (tridy.indexOf('parent') >= 0) { // zaklikava childy
                    childClass = '.' + childClass + ' span';
                    $(childClass).each(function () {
                        $(this).addClass("active");
                    });
                }
                if (tridy.indexOf('child') >= 0) { // zaklikava parenta
                    parentId = parentId + ' span';
                    $('#' + parentId).each(function () {
                        $(this).addClass("half-active");
                    });
                }
            } else {
                if (tridy.indexOf('parent') >= 0) { // zaklikava childy
                    $(event.target).addClass('half-active');
                    $(event.target).addClass('active');
                    childClass = '.' + childClass + ' span';
                    $(childClass).each(function () {
                        $(this).addClass("half-active");
                        $(this).addClass("active");
                    });
                }
                if (tridy.indexOf('child') >= 0) { // zaklikava parenta
                    $(event.target).addClass('active');
                    // @TODO neslo by neco ve stylu event.target.parents().hasClass(or-facet) ?????
                    while (parentId.match(/-/g).length >= 3) {
                        console.log(parentId.match(/-/g).length);
                        $('#' + parentId + ' span').each(function () {
                            $(this).addClass("half-active");
                            if ($('.' + parentId + ' span').length === $('.' + parentId + ' span.active').length) {
                                $(this).addClass("active");
                            }
                        });
                        parentId = parentId.split('-');
                        parentId.splice(-1,1);
                        var cislo = parseInt(parentId[2])-1;
                        parentId.splice(2,1,cislo.toString());
                        parentId = parentId.join('-');
                        console.log(parentId);
                    }
                }
            }
        } else { // alone facet
            $(event.target).toggleClass('active');
        }
    });

    $( 'body' ).on( 'click', 'li.list-group-item.and-facet span', function( event ) {
        $(event.target).toggleClass('active');
    });

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
