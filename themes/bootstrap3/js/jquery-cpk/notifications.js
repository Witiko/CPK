/**
 * New implementation of notifications. Is based on jQuery but is based
 * previous Angular-based code.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function($) {
    if (CPK.verbose === true) {
        console.log("jquery-cpk/notifications.js");
    }

    /**
     * @todo Before was the Angular module constructed like in code below we need to investigate how to correctly initialize "globalNotif" aka "globalNotifDirective".
     *
     * angular.module('notifications').controller('NotificationsController', NotificationsController).directive('globalNotif', globalNotifDirective).directive('institutionNotif', institutionNotif);
     * NotificationsController.$inject = [ '$q', '$log', '$http', '$location', '$rootScope' ];
     * globalNotifDirective.$inject = [ '$log' ];
	 *
	 * @todo Do not forgot to remove this!
     */

    /**
     * Holds DOM elements of global notifications section
     * @type {Object}
     * @see themes/bootstrap3/templates/notifications.phtml
     */
    var globalNotifHolder = {
        loader: undefined,
        parent: undefined,
        synchronousNotifications: undefined,
        warningIcon: undefined,
        unreadNotifsCount: undefined
    };

    /**
     * Holds DOM elements of "Loading..." for each institution user
     * is connected with.
     * @type {Object}
     */
    var institutionNotifLoaderHolder = {};

    /**
     * Is called after linker has done it's job which is defined
     * as done right after all globalNotifHolder's object keys
     * are filled with values.
     * @type {Function}
     */
    var onLinkerDone = function() {};

    /**
     * @param {Object} $q
     * @returns {NotificationsController}
     * @todo Resolve "$q"!
     */
    function NotificationsController($q) {
        var apiNonrelevantJobDoneFlag = false,
            onApiNonrelevantJobDone,
            unreadNotifsCount = 0,
            vm = this;

        // Public
        vm.notifications = {};
        // Note (ondrejd): I think we don't need to expose those but I will
        // delete it later... in fact at the end we should have only one
        // public method - "onReady" called from initialization part of
        // file "common.js".
        //vm.initApiRelevantNotificationsForUserCard = initApiRelevantNotificationsForUserCard;
        //vm.initApiNonrelevantNotifications = initApiNonrelevantNotifications;
        vm.onNotificationClick = onNotificationClick;
        vm.onReady = onReady;
        vm.showWarningIcon = showWarningIcon;
        vm.hideWarningIcon = hideWarningIcon;

        return vm;

        /**
         * Initializes notifications (just like linkers before for Angular app).
         * @param {Event} event
         * @return {Promise}
         */
        function onReady( event ) {
        	return Promise
				.resolve( initGlobalNotificationsHolder() )
				.then(function() {
					// Notifications DOM bindings are ready so continue with initializing notifications
					// that are not relevant to API.
					return Promise.resolve( fetchNotificationsForUser() );
				})
				.then(function( notifications ) {
					// Use obtained notifications
					return Promise.resolve( useNotificationsForUser( notifications ) );
				})
				.then(function( result ) {
					if (CPK.verbose === true) {
						console.log( result );
					}

					// XXX apiNonrelevantJobDone();

					return Promise.resolve( true );
				});
        }

		/**
		 * Initializes {@see globalNotifHolder}.
		 * @returns {Promise}
		 */
		function initGlobalNotificationsHolder() {
			return new Promise(function( resolve, reject ) {
				// If elements for `globalNotifHolder` are not found it means
				// that there is no logged user...

				// Initialize "globalNotifHolder"
				globalNotifHolder.loader = document.getElementById( "notif_loader" );
				globalNotifHolder.parent = document.getElementById( "notificationsList" );

				if (globalNotifHolder.parent !== null) {
					globalNotifHolder.parent = globalNotifHolder.parent.getElementsByTagName( "li" ).item( 0 );
				}

				globalNotifHolder.synchronousNotifications = document.getElementById( "notif_synchronous_notifications" );
				globalNotifHolder.warningIcon = document.getElementById( "notif_icon" );
				globalNotifHolder.unreadNotifsCount = document.getElementById( "notif_unread_count" );

				// Check if DOM bindings are initialized
				var res = true;
				Object.getOwnPropertyNames( globalNotifHolder ).forEach(function( prop ) {
					if ( globalNotifHolder[prop] !== null ) {
						if (globalNotifHolder[prop].nodeType !== 1) {
							res = false;
						}
					}
				});

				if (res !== true) {
					if (CPK.verbose === true) {
						console.log("globalNotifHolder is not loaded -> probably no user is logged in...");
					}

					reject( "Notifications are disabled for this session..." );
				} else {
					resolve( "Notifications DOM binding is ready..." );
				}

				// Initialize API non relevant notifications for user card (initApiNonrelevantNotifications)
				//initApiNonrelevantNotifications();


				// 6) Initialize API relevant notifications for user card (initApiRelevantNotificationsForUserCard)
				// 7) Attach handler for "notifCtrl.notifClicked(notification,"user")"
				// 8) Attach handler for "notifCtrl.notifClicked(notification,"<?=$source ?>")"

				// If everything is OK we can now check how to set up the UI
				/*if (!hasGlobalNotifications()) {
					if (apiNonrelevantJobDoneFlag) {
						hideGlobalNotifications();
					} else {
						onApiNonrelevantJobDone()
					}
				} else {
					showWarningIcon();
				}*/
			});
		}

        /**
         * Initializes an empty array for an username provided in order
         * to successfully bind data to this Controller.
         * @param {String} source
         * @param {String} username
         */
        function initApiRelevantNotificationsForUserCard(source, username) {
            vm.notifications[username] = [];

            $q.resolve(fetchNotificationsForUserCard(username)).then(function(notifications) {
                onGotNotificationsForUserCard(notifications, source, username);
            }).catch(function(reason) {
                if (CPK.verbose === true) {
                    console.error(reason);
                }
            });
        }

        /**
         * Process the notifications on user_card scale after we got them.
         * @param {Array} notifications
         * @param {String} source
         * @param {String} username
         */
        function onGotNotificationsForUserCard(notifications, source, username) {
            if (!(notifications instanceof Array)) {
                return;
            }

            vm.notifications[username] = notifications;

            if (notifications.length !== 0) {
                notifications.forEach(
                    function(notification) {
                        if (notification.clazz.match(/unread/)) {
                            ++unreadNotifsCount;
                        }
                    }
                );
                updateUnreadNotificationsCount();
                showWarningIcon();
            } else {
                CPK.global.hideDOM(institutionNotifLoaderHolder[source + ".parent"]);
            }

            hideLoader(source);
        }

        /**
         * A notification has been clicked .. follow the href if any.
         * @param {Object} notification
         * @param {String} source
         */
        function onNotificationClick(notification, source) {
            var clazz = notification.clazz,
                href  = notification.href,
                type  = notification.type;

            if (clazz.match(/unread/)) {
                --unreadNotifsCount;
                updateUnreadNotificationsCount();
                notification.clazz = clazz.replace(/[^\s]*unread/, "");
            }

            if (typeof href !== "undefined") {
                function followLocation() {
                    if (source === "user") {
                        window.location.url(href);
                    } else {
                        window.location.href = href;
                    }
                    /**
                     * @todo Finish this!!!
                     */
                    window.$broadcast("notificationClicked");
                }

                var data = {
                    notificationType: type,
                    source: source
                };

                /**
                 * @todo Test if this working properly!!!
                 */
                $.post("/AJAX/JSON?method=notificationRead", data).done(followLocation);
            }
        }

        // Private

        /**
         * Prints errors found in server's response onto console.
         * (Only when "CPK.verbose" is TRUE.)
         * @param {Object} response
         */
        function print_response_errors(response) {
            if (CPK.verbose !== true) {
                return;
            }

            if (typeof response.errors === "object") {
                response.errors.forEach(function(e) {
                    console.error(e);
                });
            }
        }

        /**
         * Fetches notifications for provided username asynchronously.
         * @param {String} username
         * @returns {Promise}
         */
        function fetchNotificationsForUserCard(username) {
            return new Promise(function(resolve, reject) {
                var data = {
                    cat_username: username
                };

                $.post("/AJAX/JSON?method=getMyNotificationsForUserCard", data)
                    .done(function(response) {
                        response = response.data.data;

                        // Print errors if any
                        print_response_errors(response);

                        if (typeof response.notifications !== "undefined") {
                            resolve(response.notifications);

                            if (response.notifications.length === 0) {
                                var msg = VuFind.translate("without_notifications");
                                $("ul#notificationsList > li#" + response.source).append(
                                    "<div class='notif-default'>" + msg + "</div>"
                                );
                            }
                        } else {
                            reject("No notifications for user card returned!");
                        }
                    })
                    .fail(function(e) {
                        reject(e);
                    });
            });
        }

        /**
         * @private Fetches notifications for current user asynchronously.
         * @returns {Promise}
         */
        function fetchNotificationsForUser() {
            return new Promise(function( resolve, reject ) {
                $.get( "/AJAX/JSON?method=getMyNotificationsForUser", null, null, "json" )
                    .done(function( response ) {
                        print_response_errors( response );

                        if ( typeof response.data.notifications !== "undefined" ) {
                            resolve( response.data.notifications );
                        } else {
                            reject( "No notifications for current user returned!" );
                        }
                    })
                    .fail(function( e ) {
                        reject( e );
                    });
            });
        }

		/**
		 * @private Use notifications for current user asynchronously.
		 * @param {Object} notifications
		 * @returns {Promise}
		 */
		function useNotificationsForUser( notifications ) {
        	return new Promise(function( resolve, reject ) {
				if ( ! ( notifications instanceof Array ) ) {
					reject( "No notifications passed!" );
				}

				if ( typeof vm.notifications.noApi !== "object" ) {
					vm.notifications.noApi = {};
				}

				vm.notifications.noApi.user = notifications;

				notifications.forEach(function( notification ) {
					if ( notification.clazz.match( /unread/ ) ) {
						++unreadNotifsCount;
					}
				});

				updateUnreadNotificationsCount();
				showWarningIcon();

				// XXX apiNonrelevantJobDone();

				resolve( "User's notifications successfully used" );
			});
		}

        /**
         * Hides a loader for an institution. It hides a loader associated
         * with portal notifications if no source provided.
         * @param {String} source
         */
        function hideLoader(source) {
            CPK.global.hideDOM(typeof source === "undefined"
                ? globalNotifHolder.loader
                : institutionNotifLoaderHolder[source]);

            if (!hasGlobalNotifications()) {
                hideGlobalNotifications();
            }
        }

        /**
         * Shows up a previously hidden loader for an institution. It shows up
         * a loader associated with portal notifications if no source provided.
         * @param {String} source
         */
        function showLoader(source) {
            CPK.global.showDOM(typeof source === "undefined"
                ? globalNotifHolder.loader
                : institutionNotifLoaderHolder[source]);

            if (hasGlobalNotifications()) {
                showGlobalNotifications();
            }
        }

        /**
         * Hides warning icon.
         */
        function hideWarningIcon() {
        	if ( unreadNotifsCount === 0 ) {
				globalNotifHolder.warningIcon.style.display = "none";
			}
        }

        /**
         * Shows warning icon by setting DOM element's style to nothing.
         * @todo Shouldn't be "block" instead of empty string?!
         */
        function showWarningIcon() {
        	if ( unreadNotifsCount > 0 ) {
				globalNotifHolder.warningIcon.style.display = "";
			}
        }

        /**
         * Sets the count to the counter of unread notifications.
         */
        function updateUnreadNotificationsCount() {
            globalNotifHolder.unreadNotifsCount.textContent = parseInt( unreadNotifsCount );
        }

        /**
         * Hides up the global notification section.
         */
        function hideGlobalNotifications() {
            CPK.global.hideDOM(globalNotifHolder.parent);
        }

        /**
         * Shows up the global notification section.
         */
        function showGlobalNotifications() {
            CPK.global.showDOM(globalNotifHolder.parent);
        }

        /**
         * Checks if are there currently any global notifications.
         * @returns {boolean}
         */
        function hasGlobalNotifications() {
            var hasSynchronousGlobalNotifications = globalNotifHolder.synchronousNotifications.children.length !== 0,
                hasApiNonrelevantNotifications = typeof vm.notifications.noAPI.user === "object" && vm.notifications.noAPI.user.length !== 0;

            return hasSynchronousGlobalNotifications || hasApiNonrelevantNotifications;
        }

        /**
         * Called when API non-relevant job is done.
         */
        function apiNonrelevantJobDone() {
            apiNonrelevantJobDoneFlag = true;

            if (typeof onApiNonrelevantJobDone === "function") {
                onApiNonrelevantJobDone.call();
            }
        }
    }

    /**
     * Checks if the linker is done linking by checking variables within {@see globalNotifHolder}
     * variable are all set to same value.
     *
     * It calls {@see onLinkerDone()} if it is done.
     */
    function checkLinkerIsDone() {
        if (typeof buf === "undefined") {
            buf = {};
            buf["globalNotifHolderKeys"] = Object.keys(globalNotifHolder);
            buf["globalNotifHolderKeysLength"] = buf["globalNotifHolderKeys"].length;
        }

        for (var i = 0; i < buf["globalNotifHolderKeysLength"];) {
            if (typeof globalNotifHolder[buf["globalNotifHolderKeys"][i]] === "undefined") {
                break;
            }

            if (++i === buf["globalNotifHolderKeysLength"]) {
                if (typeof onLinkerDone === "function") {
                    onLinkerDone();
                } else if (CPK.verbose === true) {
                    console.error("onLinkerDone must be a function!");
                }
            }
        }
    }

    /**
     * Hooks DOM elements to an variable associated with particular institution identity.
     * @returns {Object}
     */
    function institutionNotif() {
        return {
            restrict: "A",
            link: linker
        };

        function linker(scope, elms, attrs) {
            var source = attrs.institutionNotif;
            // Now we really need to hook only the warning icons to each
            institutionNotifLoaderHolder[source] = elms.context;
        }
    }

    /**
     * @type {NotificationsController}
     */
    CPK.notifications = new NotificationsController(null);

}(jQuery));