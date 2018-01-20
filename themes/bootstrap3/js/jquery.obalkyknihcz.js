/**
 * jQuery Plugin for ObalkyKnih.cz.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 *
 * @todo Check {@link https://github.com/moravianlibrary/CPK/commit/412d9dcd24ab1f9af8fda4844da18289332f8c22?diff=unified} and absorb it (names of PDF downloads)!
 * @todo Don't forgot on bug {@link https://bugzilla.knihovny.cz/show_bug.cgi?id=250}.
 * @todo Try to minify this (if it works well).
 * @todo Add QUnit tests!
 * @todo Check if all strings for `VuFind.translate` are really registered!
 * @todo [PHP] We need ZF view helpers to render all.
 * @todo Use `Function.bind()` and `Function.call()` whenever it's possible (instead of nested functions).
 * @todo We should primarily use book's metadata -> even `fetchImage` gathers images that are mentioned in there....
 * @todo Instead of expiration we will use maximal count of records (per key) in cache.
 * @todo Keep in mind that sizes are: thumbnail: 27x36, icon: 54x68, medium: 170x240, preview510: 510x527
 */

(function( $, document ) {
	"use strict";

	/**
	 * Prototype for cache item.
	 * @param {string} id Record's identifier ("mzkXXXX..").
	 * @property {NULL|string} id
	 * @property {NULL|string} icon_url
	 * @property {NULL|string} medium_url
	 * @property {NULL|string} pdf_url
	 * @property {NULL|string} preview_url
	 * @property {NULL|string} thumbnail_url
	 * @property {NULL|string} summary
	 * @property {NULL|string} summary_short
	 * @constructor
	 */
	function CoverCacheItemPrototype( id ) {
		this.id = id;
		this.icon_url = null;
		this.medium_url = null;
		this.pdf_url = null;
		this.preview_url = null;
		this.thumbnail_url = null;
		this.summary = null;
		this.summary_short = null;
	}

	/**
	 * Parses {@see CoverCacheItemPrototype} from the given object.
	 * @param {Object} obj
	 * @returns {CoverCacheItemPrototype}
	 */
	CoverCacheItemPrototype.parseFromObject = function( obj ) {
		var cacheItem = new CoverCacheItemPrototype();

		cacheItem.id = obj.hasOwnProperty( "id" ) ? obj.id : null;
		cacheItem.icon_url = obj.hasOwnProperty( "icon_url" ) ? obj.icon_url : null;
		cacheItem.medium_url = obj.hasOwnProperty( "medium_url" ) ? obj.medium_url : null;
		cacheItem.pdf_url = obj.hasOwnProperty( "pdf_url" ) ? obj.pdf_url : null;
		cacheItem.preview_url = obj.hasOwnProperty( "preview_url" ) ? obj.preview_url : null;
		cacheItem.thumbnail_url = obj.hasOwnProperty( "thumbnail_url" ) ? obj.thumbnail_url : null;
		cacheItem.summary = obj.hasOwnProperty( "summary" ) ? obj.summary : null;
		cacheItem.summary_short = obj.hasOwnProperty( "summary_short" ) ? obj.summary_short : null;

		return cacheItem;
	};

	/**
	 * @private Processes elements that represent covers.
	 * @param {CoverPrototype} cvr
	 * @param {string} extra (Optional.)
	 */
	function processCover( cvr, extra ) {
		extra = extra === undefined ? "icon" : extra;

		switch( cvr.action ) {

			// These actions don't perform Ajax (and is better to render
			// them through PHP using ZF view helpers if possible).
			case "fetchImage": fetchImage( cvr, extra ); break;
			case "fetchImageWithoutLinks": fetchImageWithoutLinks( cvr, extra ); break;
			case "displayThumbnail": displayThumbnail( cvr ); break;
			case "displayThumbnailWithoutLinks": displayThumbnailWithoutLinks( cvr ); break;

			// These actions perform Ajax but grouping is not possible
			case "displayCover": displayCover( cvr ); break;
			case "displayCoverWithoutLinks": displayCoverWithoutLinks( cvr ); break;
			case "displayThumbnailCoverWithoutLinks": displayThumbnailCoverWithoutLinks( cvr ); break;

			// These actions perform Ajax and are grouped
			case "displayAuthorityCover": displayAuthorityCover( cvr ); break;
			case "displayAuthorityThumbnailCoverWithoutLinks": displayAuthorityThumbnailCoverWithoutLinks( cvr ); break;
			case "displaySummary": displaySummary( cvr ); break;
			case "displaySummaryShort": displaySummaryShort( cvr ); break;
		}
	}

	/**
	 * @private Returns URL for the cover's image.
	 * @param {string} baseUrl
	 * @param {Object} bibInfo
	 * @param {string} type
	 * @param {string} query
	 * @returns {string}
	 */
	function getImageUrl( baseUrl, bibInfo, type, query ) {
		return baseUrl + "?multi=" + encodeURIComponent( JSON.stringify( bibInfo ) ) +
			"&type=" + type + "&keywords=" + encodeURIComponent( query );
	}

	/**
	 * @private Creates image element.
	 * @param {string} src
	 * @param {string} alt
	 * @param {string} type
	 * @returns {HTMLImageElement}
	 */
	function createImage( src, alt, type ) {
		var img = document.createElement( "img" );

		img.setAttribute( "src", src );
		img.setAttribute( "alt", alt );
		img.classList.add( "obalkyknihcz-" + type );

		return img;
	}

	/**
	 * @private Creates anchor element.
	 * @param {string} href
	 * @param {HTMLImageElement} img
	 * @returns {HTMLAnchorElement}
	 */
	function createAnchor( href, img ) {
		var a = document.createElement( "a" );

		a.setAttribute( "href", href );
		a.classList.add( "title" );
		a.appendChild( img );

		return a;
	}

	/**
	 * @private Creates div element.
	 * @param {string} cls
	 * @param {HTMLAnchorElement|HTMLImageElement} elm
	 * @returns {HTMLDivElement}
	 */
	function createDiv( cls, elm ) {
		var div = document.createElement( "div" );

		div.classList.add( "obalkyknihcz-" + cls );
		div.appendChild( elm );

		return div;
	}

	/**
	 * @private Returns cache for the images.
	 * @param {string} key
	 * @returns {object}
	 */
	function getCache( key ) {
		var cache = localStorage.getItem( key );

		if ( cache === null ) {
			cache = Object.create( null );
		} else if ( typeof cache === "string" ) {
			cache = JSON.parse( cache );
		}

		return cache;
	}

	/**
	 * @private Saves data into the cache.
	 * @param {string} key
	 * @param {object} data
	 */
	function setCache( key, data ) {
		localStorage.setItem( key, JSON.stringify( data ));
	}

	/**
	 * @private Retrieves cached cover's data.
	 * @param {string} key
	 * @returns {NULL|CoverCacheItemPrototype}
	 */
	function getCacheItem( key ) {
		var cache = getCache( "cpk_obalkyknihcz" );
		return ( cache[ key ] !== undefined ) ? CoverCacheItemPrototype.parseFromObject( cache[ key ] ) : null;
	}

	/**
	 * @private Saves cover's data into the cache.
	 * @param {string} key
	 * @param {CoverCacheItemPrototype} data
	 */
	function setCacheItem( key, data ) {
		var cache = getCache( "cpk_obalkyknihcz" );
		cache[ key ] = data;
		setCache( "cpk_obalkyknihcz", cache );
	}

	/**
	 * @private Fetches image for the given cover.
	 * @param {CoverPrototype} cover
	 * @param {string} type (Optional.)
	 * @param {boolean} withoutLinks (Optional.)
	 */
	function fetchImage( cover, type, withoutLinks ) {
		type = type === undefined ? "medium" : type;
		withoutLinks = withoutLinks === undefined ? "medium" : withoutLinks;

		/**
		 * @private Creates final HTML.
		 * @param {HTMLImageElement} img
		 */
		function useImage( img ) {
			var imgElm = createImage( img.src, obalkyknihcz.coverText.toString(), type );

			if ( withoutLinks === true ) {
				$( cover.target ).empty().append( imgElm );
			} else {
				var aElm = createAnchor( getCoverTargetUrl( cover.bibInfo ), imgElm );
				$( cover.target ).empty().append( aElm );
			}
		}

		/**
		 * @type {CoverCacheItemPrototype|null}
		 */
		var cachedItem = getCacheItem( cover.record );
		var propName   = "medium_url",
		    cacheUsed  = false;

		// Set property name to get correct URL
		switch( type ) {
			case "icon":
			case "medium":
			case "thumbnail":
				propName = type + "_url";
				break;

			default:
				propName = "medium_url";
				break;
		}

		// Try to get image from cache
		if ( cachedItem !== null && typeof cachedItem === "object" ) {
			if ( ( propName in cachedItem ) && $.type( cachedItem[ propName ] ) === "string" ) {
				$.ajax({
					url: cachedItem[ propName ],
					dataType: "image",
					success: function( img ) {
						useImage( img );
					}
				});
			}
		}

		if ( cacheUsed === true ) {
			return;
		}

		// Get image from server
		$.ajax({
			url: getImageUrl( obalkyknihcz.coverUrl, cover.bibInfo, type, cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( img ) {
					if ( cachedItem === null || typeof cachedItem !== "object" ) {
						cachedItem = new CoverCacheItemPrototype( cover.record );
						cachedItem[ propName ] = img.src;
					} else {
						cachedItem[ propName ] = img.src;
					}

					useImage( img );
					setCacheItem( cover.record, cachedItem );
				}
			}
		});
	}

	/**
	 * @private Fetches image for the given cover. Renders image without link.
	 * @param {CoverPrototype} cover
	 * @param {string} type (Optional.)
	 */
	function fetchImageWithoutLinks( cover, type ) {
		fetchImage( cover, type, true );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnail( cover ) {
		fetchImage( cover, "medium", false );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnailWithoutLinks( cover ) {
		fetchImage( cover, "medium", true );
	}

	/**
	 * @param {CoverPrototype} cover
	 * @param {boolean} withoutLinks (Optional.)
	 * @param {boolean} withoutToc (Optional.)
	 * @todo Use cache!
	 * @todo Cache TOC!!!!!
	 */
	function displayCover( cover, withoutLinks, withoutToc ) {
		console.log( "obalkyknihcz.displayCover", cover, withoutLinks, withoutToc );

		// Normalize arguments
		withoutLinks = withoutLinks === undefined ? false : withoutLinks;
		withoutToc   = withoutToc === undefined ? false : withoutToc;

		/**
		 * @type {CoverCacheItemPrototype} cacheItem
		 */
		var cacheItem = getCacheItem( cover.record ),
		    isCacheItem = false;

		if ( cacheItem !== null && typeof cacheItem === "object" ) {
			isCacheItem = true;
		} else {
			cacheItem = new CoverCacheItemPrototype( cover.record );
		}

		// We need to save current inner HTML (if Xhr request(s) failed
		// we will use it) - but firstly we need to remove <div> with
		// definition of the cover.
		$( cover.target ).find( "div[data-obalkyknihcz]" ).remove();
		var tmp  = ( new String( $( cover.target ).html() ) ).trim();

		// Empty target element
		$( cover.target ).empty();

		/**
		 * @private Creates HTML for the cover image.
		 * @param {string} imgUrl
		 * @param {string} alt
		 */
		function useCoverImage( imgUrl, alt ) {
			var imgElm = createImage( imgUrl, alt, "medium" );

			if ( withoutLinks === true ) {
				$( cover.target ).prepend( createDiv( "cover", imgElm ) );
			} else {
				var anchorElm = createAnchor( getCoverTargetUrl( cover.bibInfo ), imgElm );
				$( cover.target ).prepend( createDiv( "cover", anchorElm ) );
			}
		}

		/**
		 * @private Tries to restore original HTML if request(s) failed.
		 */
		function tryToRestore() {
			$( cover.target ).append( tmp );
		}

		if ( isCacheItem === true && ( "medium_url" in cacheItem ) && $.type( cacheItem.medium_url ) === "string" ) {
			console.log( "Using cache item:", cacheItem );
			useCoverImage( cacheItem.medium_url, obalkyknihcz.coverText.toString() );
		} else {

			// Use ajax to load the image
			$.ajax({
				url: getImageUrl( obalkyknihcz.coverUrl.toString(), cover.bibInfo, "medium", cover.advert ),
				dataType: "image",
				success: function( img ) {
					if ( ! img ) {
						tryToRestore();
					} else {
						cacheItem.medium_url = img.src;
						setCacheItem( cover.record, cacheItem );
						useCoverImage( img.src, obalkyknihcz.coverText.toString() );
					}
				},
				fail: function() {
					tryToRestore();
				}
			});
		}

		// Now get PDF (TOC)
		if ( withoutToc === true ) {
			//tryToRestore();
			return;
		}

		// TODO IF ( is in the cache "pdf_url" ) THEN "use it" ELSE "ajax"

		// Secondly we need to load TOC
		$.ajax({
			url: getImageUrl( obalkyknihcz.tocUrl.toString(), cover.bibInfo, "medium", cover.advert ),
			dataType: "image",
			success: function( img ) {
				if ( ! img ) {
					fail = true;
					return;
				} else {
					cacheItem.pdf_url = img.src;
					setCacheItem( cover.record, cacheItem );
				}

				console.log( "Loaded TOC image ... CACHE IT !!!", img );

				var imgElm = createImage( img.src, obalkyknihcz.tocText.toString(), "medium" );

				if ( withoutLinks === true ) {
					$( cover.target.append( createDiv( "toc", imgElm ) ) );
				} else {
					var anchorElm = createAnchor( getPdfTargetUrl( cover.bibInfo ), imgElm );
					$( cover.target ).append( createDiv( "toc", anchorElm ) );
				}

				fail = false;
			},
			fail: function() {
				fail = true;
			}
		});
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayCoverWithoutLinks( cover ) {
		displayCover( cover, true, false );
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayThumbnailCoverWithoutLinks( cover ) {
		console.log( "displayThumbnailCoverWithoutLinks", cover );
		displayCover( cover, true, true );
	}

	/**
	 * @private Helper method for creating HTML of authority's cover.
	 * @param {string} imgUrl
	 * @param {string} imgAlt
	 * @param {string} authId
	 * @param {boolean} withoutLinks
	 * @param {HTMLElement} target
	 */
	function createAuthorityCover( imgUrl, imgAlt, authId, target, withoutLinks ) {
		$.ajax({
			url: imgUrl,
			dataType: "image",
			success: function( img ) {
				var imgElm = createImage( img.src, imgAlt, "medium" );
				withoutLinks = withoutLinks === undefined ? false : withoutLinks;

				if( withoutLinks === true ) {
					$( target ).empty().append( createDiv( "cover", imgElm ) );
				} else {
					var anchorUrl = "https://www.obalkyknih.cz/view_auth?auth_id=" + authId,
					    anchorElm = createAnchor( anchorUrl, imgElm );

					$( target ).empty().append( createDiv( "cover", anchorElm ) );
				}
			}
		});
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayAuthorityCover( cover, withoutLinks ) {
		var authId = cover.bibInfo.auth_id,
			cacheItem = getCacheItem( authId ),
			alt = obalkyknihcz.authorityCoverText.toString();
		withoutLinks = withoutLinks === undefined ? false : withoutLinks;

		// Check if there is cached image and use it if yes
		if ( cacheItem !== null && typeof cacheItem === "object" ) {
			if ( ( "medium_url" in cacheItem ) && $.type( cacheItem.medium_url ) === "string" ) {
				createAuthorityCover( cacheItem.medium_url, alt, authId, cover.target, withoutLinks );
				return;
			}
		}

		// Otherwise get it via JSON (and cache it after we successfully get the image).
		$.getJSON(
			"/AJAX/JSON?method=getObalkyKnihAuthorityID",
			{ id: authId },
			function( data ) {
				try {
					cacheItem = new CoverCacheItemPrototype( cover.record );
					cacheItem.auth_id = authId;
					cacheItem.medium_url = data.data.cover_medium_url;
					cacheItem.preview_url = data.data.cover_preview510_url;

					setCacheItem( authId, cacheItem );
					createAuthorityCover( data.data.cover_medium_url, alt, authId, cover.target, withoutLinks );
				} catch( e ) { console.error( e );/* ... */ }
			}
		);
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displayAuthorityThumbnailCoverWithoutLinks( cover ) {
		displayAuthorityCover( cover, true );
	}

	/**
	 * @private Uses given summary (displays it)
	 * @param {string} partialId
	 * @param {string} summary
	 */
	function useSummary( partialId, summary ) {
		$( document.getElementById( "short_summary_" + partialId ) ).html( summary );
	}

	/**
	 * @param {CoverPrototype} cover
	 * @param {boolean} short (Optional.) Defaultly `FALSE`.
	 */
	function displaySummary( cover, short ) {
		var cacheItem = getCacheItem( cover.record );
		short = short === undefined ? false : short;

		// Check if summary is already cached or not
		if ( cacheItem !== null && typeof cacheItem === "object" ) {
			if ( ( short === false && "summary" in cacheItem ) && $.type( cacheItem.summary ) === "string" ) {
				useSummary( cover.record, cacheItem.summary );
				return;
			} else if ( ( short === true && "summary_short" in cacheItem ) && $.type( cacheItem.summary_short ) === "string" ) {
				useSummary( cover.record, cacheItem.summary_short );
				return;
			}
		}

		// Not in cache, use Ajax and than save it into the cache.
		$.getJSON(
			short === true ? "/AJAX/JSON?method=getSummaryShortObalkyKnih" : "/AJAX/JSON?method=getSummaryObalkyKnih",
			{ bibinfo: cover.bibInfo },
			function( data ) {
				if ( cacheItem === null || typeof( cacheItem ) !== "object" ) {
					cacheItem = new CoverCacheItemPrototype( cover.record );
				}

				if ( short === true ) {
					cacheItem.summary_short = data.data;
				} else {
					cacheItem.summary = data.data;
				}

				setCacheItem( cover.record, cacheItem );
				useSummary( cover.record, data.data );
			}
		);
	}

	/**
	 * @param {CoverPrototype} cover
	 */
	function displaySummaryShort( cover ) {
		displaySummary( cover, true );
	}

	// Other private methods (utilities)

	/**
	 * @private Returns correct URL for the cover with given bibInfo.
	 * @param {{ isbn: string, nbn: string, auth_id: string, oclc: string}} bibInfo
	 * @returns {string}
	 */
	function getCoverTargetUrl( bibInfo ) {
		return obalkyknihcz.linkUrl + "?" + queryPart( bibInfo );
	}

	/**
	 * @private Returns correct URL for PDFs.
	 * @param {{ isbn: string, nbn: string, auth_id: string, oclc: string}} bibInfo
	 * @returns {string}
	 */
	function getPdfTargetUrl( bibInfo ) {
		return obalkyknihcz.pdfUrl + "?" + queryPart( bibInfo );
	}

	/**
	 * @private Creates GET parameters from given `bibInfo`
	 * @param {{ isbn: string, nbn: string, auth_id: string, oclc: string}} bibInfo
	 * @returns {string}
	 */
	function queryPart( bibInfo ) {
		var query = "",
			sep   = "";

		$.each( bibInfo, function( name, value ) {
			query += sep + name + "=" + encodeURIComponent( value );
			sep = "&";
		} );

		return query;
	}

	// Implementation of the jQuery plugin self

	/**
	 * Base of our plugin.
	 *
	 * It works two ways:
	 * 1) by getting neccessarry data from the data attributes of the target element
	 * 2) by putting these data directly through arguments
	 *
	 * Here are the examples:
	 *
	 * <pre>
	 * jQuery( "[data-obalkyknihcz]" ).obalkyknihcz(); // The first case
	 * jQuery( "#some-element" ).obalkyknihcz( "fetchImage", advert, bibInfo, recordId ); // The second case
	 * </pre>
	 *
	 * In both cases we need to check if there are not actions we can group.
	 * This all is because we need to reduce amount of XHR calls.
	 *
	 * We need to separate (and group) these actions:
	 * - `displayAuthorityCover` and `displayAuthorityThumbnailCoverWithoutLinks`
	 * - `displaySummary` and `displaySummaryShort`
	 *
	 * If these will be grouped and thus perform just one XHR call per group
	 * we will be satisfied.
	 *
	 * @param {string} action (Optional.)
	 * @param {string} advert
	 * @param {{ isbn: string, nbn: string, auth_id: string, cover_medium_url: string, oclc: string}} bibInfo (Optional.)
	 * @param {string} record
	 * @return {jQuery}
	 */
	function obalkyknihcz( action, advert, bibInfo, record ) {

		/**
		 * @type {{authority: CoverPrototype[], summary: CoverPrototype[]}}
		 */
		var tmp = { authority: [], summary: [] };

		/**
		 * @private Processes (split) covers.
		 * @param {CoverPrototype} cvr
		 */
		function splitCovers( cvr ) {
			switch ( cvr.action ) {

				// These actions will be processed normally
				case "fetchImage":
				case "fetchImageWithoutLinks":
				case "displayThumbnail":
				case "displayThumbnailWithoutLinks":
				case "displayCover":
				case "displayCoverWithoutLinks":
				case "displayThumbnailCoverWithoutLinks":
				// TODO Remove this!!!!!
				case "displaySummary":
				case "displaySummaryShort":
				case "displayAuthorityCover":
				case "displayAuthorityThumbnailCoverWithoutLinks":
					processCover( cvr );
					break;

				/*// These will be grouped
				case "displayAuthorityCover":
				case "displayAuthorityThumbnailCoverWithoutLinks":
					tmp.authority.push( cvr );
					break;*/

				/*case "displaySummary":
				case "displaySummaryShort":
					tmp.summary.push( cvr );
					break;*/
			}
		}

		/**
		 * @private Processes actions `displayAuthorityCover` and `displayAuthorityThumbnailCoverWithoutLinks`.
		 */
		function processAuthRequests() {
			var auth_ids = [],
			    cached   = [];

			// Collect ID of authorities (and find out if they are cached or not).
			tmp.authority.forEach(function( c ) {
				var cacheItem = getCacheItem( c.bibInfo.auth_id ),
				    isCached = false;

				if ( cacheItem !== null && typeof cacheItem === "object" ) {
					if ( cacheItem.medium_url !== undefined && $.type( cacheItem.medium_url ) === "string" ) {
						cached.push( cacheItem );
						isCached = true;
					}
				}

				if ( isCached !== true ) {
					auth_ids.push( c.bibInfo.auth_id );
				}
			});

			// If there are no authorities to resolve stop it
			if ( auth_ids.length === 0 && cached.length === 0 ) {
				return;
			}

			/**
			 * @param {object} obj
			 */
			function prepareCached( obj ) {
				try {
					var authorMetadata = $.fn.cpk.AuthorityMetadata.parseFromObject( obj ),
						cacheItem = new CoverCacheItemPrototype( authorMetadata.authinfo.auth_id );

					cacheItem.medium_url = authorMetadata.cover_medium_url;
					cacheItem.preview_url = authorMetadata.cover_preview510_url;

					cached.push( cacheItem );
					setCacheItem( authorMetadata.authinfo.auth_id, cacheItem );
				} catch( e ) { /* ... */
					console.log( obj, e ); // TODO Remove this!
				}
			}

			/**
			 * @private Process single authority metadata item.
			 * @param {CoverCacheItemPrototype} data
			 */
			function processCached( data ) {
				tmp.authority.forEach(function( cvr ) {
					if ( cvr.bibInfo.auth_id === data.id || cvr.record === data.id ) {
						var withoutLinks = ( cvr.action === "displayAuthorityCover" ) ? false : true,
							alt = obalkyknihcz.authorityCoverText.toString();

						createAuthorityCover( data.medium_url, alt, data.id, cvr.target, withoutLinks );
					}
				});
			}

			if ( auth_ids.length > 0 ) {

				// Get covers
				$.ajax({
					dataType: "json", // TODO Set type to "authority-metadata"...
					url: "/AJAX/JSON?method=getMultipleAuthorityCovers",
					data: { id: auth_ids.join( "," ) },
					global: false,
					method: "GET",
					/**
					 * @param {{ data: array, status: string }} data
					 * @param {string} textStatus
					 * @param {jqXHR} jqXhr
					 */
					success: function( data, textStatus, jqXhr ) {

						// Check status
						if ( textStatus !== "success" ) {
							console.error( "Requesst for covers of authorities failed!", data );
							return;
						}

						// Check if correct data are returned
						if ( data.data === undefined || ! jQuery.isArray( data.data ) ) {
							console.error( "Request for covers of authorities failed!", data );
							return;
						}

						// Save all new data into the cache
						data.data.forEach( prepareCached );
					},
					/**
					 * @param {jqXHR} jqXhr
					 * @param {string} textStatus
					 */
					complete: function( jqXhr, textStatus ) {

						// Now process all cached items
						cached.forEach( processCached );
					}
				});
			} else {

				// Process just all cached
				cached.forEach( processCached );
			}
		}

		/**
		 * @private Processes actions `displaySummary` and `displaySummaryShort`.
		 * @returns {Promise}
		 */
		function processSummRequests() {
			console.log( "TODO processSummRequests" );
			var bibInfo = [],
			    cached  = [];

			// Collects all bibInfos
			tmp.summary.forEach(function( c ) {
				var cacheItem = getCacheItem( c.record ),
				    isCached = false;

				if ( cacheItem !== null && typeof cacheItem === "object" ) {
					console.log( c.action );

					if ( c.action === "displaySummary" ) {
						if ( cacheItem.summary !== undefined && $.type( cacheItem.summary ) === "string" ) {
							cached.push( cacheItem );
							isCached = true;
						}
					} else {
						if ( cacheItem.summary_short !== undefined && $.type( cacheItem.summary_short ) === "string" ) {
							cached.push( cacheItem );
							isCached = true;
						}
					}
				}

				if ( isCached !== true ) {
					bibInfo.push( c.bibInfo );
				}
			});

			// If there are no summaries to resolve stop it
			if ( bibInfo.length === 0 && cached.length === 0 ) {
				return;
			}

			console.log( bibInfo, cached );

			// Perform XHR request for all metadata
			$.ajax({
				dataType: "json",
				url: "/AJAX/JSON?method=getMultipleSummaries",
				method: "POST",
				data: { "multi": bibInfo },
				global: false,
				success: function( data, textStatus, jqXhr ) {
					console.log( data, textStatus, jqXhr );
				},
				complete: function( jqXhr, textStatus ) {
					console.log( jqXhr, textStatus );
				}
			});
		}

		/**
		 * Are passed arguments or are expected to be get from the data-attributes of the target elements?
		 * @type {boolean}
		 */
		var areArgs = ( action !== undefined && !!bibInfo );

		// Initialize `obalkyknihcz` for all the target elements.
		$( this ).each(function( idx, elm ) {
			var cvr = ( areArgs === true ) ?
				new $.fn.cpk.Cover( action, advert, bibInfo, record, elm )
				: $.fn.cpk.Cover.parseFromElement( elm );

			splitCovers( cvr );
		});

		$.when( processAuthRequests(), processSummRequests() );

		return this;
	}

	// Default plugin options

	// Set default cache URL
	var cacheUrl = "https://cache.obalkyknih.cz";

	// Other properties
	Object.defineProperties( obalkyknihcz, {
		"cacheUrl": { get: function() { return cacheUrl; }, set: function( v ) { cacheUrl = v; } },
		"coverUrl": { get: function() { return cacheUrl + "/api/cover"; } },
		"tocUrl": { get: function() { return cacheUrl + "/api/toc/thumbnail"; } },
		"pdfUrl": { get: function() { return cacheUrl + "/api/toc/pdf"; } },
		"linkUrl": { get: function() { return "https://www.obalkyknih.cz/view"; } },
		"coverText": { get: function() { return VuFind.translate( "Cover for the item" ); } },
		"tocText": { get: function() { return VuFind.translate( "Table of contents" ); } },
		"noImgUrl": { get: function() { return "themes/bootstrap3/images/noCover.jpg"; } },
		"authorityCoverText": { get: function() { return VuFind.translate( "Cover for the authority" ); } }
	});

	// Publish it all for jQuery

	/**
	 * @property {string} coverUrl
	 * @property {string} tocUrl
	 * @property {string} pdfUrl
	 * @property {string} linkUrl
	 * @property {string} coverText
	 * @property {string} tocText
	 * @property {string} noImgUrl
	 * @property {string} authorityCoverText
	 * @type {obalkyknihcz}
	 */
	$.fn.obalkyknihcz = obalkyknihcz;

	// TODO This is just a temporary solution

	// Initializes all elements with attribute 'data-cover="true"'
	$( document ).ready(function() {
		$( '[data-obalkyknihcz]' ).obalkyknihcz();
	});

	// Return context to allow chaining
	return this;

}( jQuery, document ));
