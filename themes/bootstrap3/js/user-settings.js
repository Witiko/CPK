jQuery( document ).ready( function( $ ) {
	$( 'select[name="citation-style"]' ).on( 'change', function() {
		$( '.citation-style-status' ).html( "<i class='fa fa-spinner fa-spin'></i>" );
		$.ajax({
			type: 'POST',
			url: '/AJAX/JSON?method=setCitationStyle',
			dataType: 'json',
			async: true,
			data: {
			    citationStyleValue: $( this ).val()
			},
			success: function( response ) {
			    $( '.citation-style-status i' ).removeClass('fa-spinner fa-spin').addClass('fa-thumbs-o-up');
			}
		});
	});
	$( 'select[name="records-per-page"]' ).on( 'change', function() {
		$( '.records-per-page-status' ).html( "<i class='fa fa-spinner fa-spin'></i>" );
		var value = $( this ).val();
		$.ajax({
			type: 'POST',
			url: '/AJAX/JSON?method=setRecordsPerPage',
			dataType: 'json',
			async: true,
			data: {
			    recordsPerPage: value
			},
			success: function( response ) {
				$( '.searchForm input[name="limit"]' ).val(value);
				$( '.records-per-page-status i' ).removeClass('fa-spinner fa-spin').addClass('fa-thumbs-o-up');
				$( "input[name='limit']" ).val( value );
			}
		});
	});
	$( 'select[name="preferred-sorting"]' ).on( 'change', function() {
		$( '.preferred-sorting-status' ).html( "<i class='fa fa-spinner fa-spin'></i>" );
		var value = $( this ).val();
		$.ajax({
			type: 'POST',
			url: '/AJAX/JSON?method=setPreferredSorting',
			dataType: 'json',
			async: true,
			data: {
			    preferredSorting: value
			},
			success: function( response ) {
				$( '.searchForm input[name="sort"]' ).val(value);
				$( '.preferred-sorting-status i' ).removeClass('fa-spinner fa-spin').addClass('fa-thumbs-o-up');
			}
		});
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

    $( '#institutions, #records-per-page, #citation-style, #preferred-sorting' ).select2();
});