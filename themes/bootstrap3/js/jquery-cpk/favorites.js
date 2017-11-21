/**
 * New implementation of Favorites. Is based on jQuery but it keeps
 * previous Angular-based code in mind.
 *
 * Basically there is a new global variable CPK.favorites which
 * is object and contains these properties:
 *
 * - favorites.available : all objects that was parsed on page and
 *   are thus available for favorites service.
 * - favorites.Favorite : prototype object for new favorites,
 * - favorites.notifications : notification service,
 * - favorites.storage : storage service for favorites.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function() {
    console.log("jquery-cpk/favorites.js");
    var $usedStorageType = "localStorage";

    /**
     * @private Returns TRUE if storage is supported.
     * @param {String} storageType
     * @returns {boolean}
     */
    function isSupported(storageType) {
        try {
            var storage = window[storageType],
                x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch(e) {
            return false
        }
    }

    if (!isSupported($usedStorageType)) {
        console.log("Storage '" + $usedStorageType + "' is not available. We will use fake storage...");

        /**
         * @private Initializes fake storage (maybe use cookies as a storage, {@link https://developer.mozilla.org/en-US/docs/Web/API/Storage/LocalStorage}.
         * @param {String} storageType
         * @returns {void}
         */
        function initStorage(storageType) {

            var store = {
                /**
                 * Set item.
                 * @param {String} id
                 * @param {String} val
                 * @returns {String}
                 */
                setItem : function (id, val) {
                    return store[id] = String(val);
                },
                /**
                 * Get item's value.
                 * @param {String} id
                 * @returns {String}
                 */
                getItem: function (id) {
                    return store.hasOwnProperty(id) ? String(store[id]) : undefined;
                },
                /**
                 * Remove item with given id.
                 * @param {String} id
                 * @returns {boolean}
                 */
                removeItem: function (id) {
                    return delete store[id];
                },
                /**
                 * Clear the storage.
                 * @returns {void}
                 */
                clear: function () {
                    initStorage(storageType);
                }
            };
            window[storageType] = store;
        }

        initStorage($usedStorageType);
    }

    /**
     * @returns {Favorite}
     * @constructor
     * @property {String} title
     * @property {String} titleLink
     * @property {String} author
     * @property {String} authorLink
     * @property {String} published
     * @property {String} format
     * @property {String} formatIconClass
     * @property {String} image
     * @property {String} icon
     * @property {String} iconStyle
     * @property {String} created
     */
    var Favorite = function() {
        var $searchItems = undefined;

        var updateSearchItems = function() {
            $searchItems = $("div#result-list-placeholder").children();
        };

        /**
         * @private
         * @type {Object} $vars
         */
        var $vars = {
            title: undefined,
            titleLink: undefined,
            author: undefined,
            authorLink: undefined,
            published: undefined,
            format: undefined,
            formatIconClass: undefined,
            image: undefined,
            icon: undefined,
            iconStyle: undefined,
            created: (new Date()).getTime()
        };

        /**
         * Creates Favorite from given object.
         * @param {Object} obj
         */
        this.fromObject = function(obj) {
            if (typeof obj !== "object") {
                console.error("Trying to create Favorite from object, but no object was passed!");
            } else if (!obj.hasOwnProperty("created")) {
                console.error("Missing timestamp property in the passed object!");
            } else {
                $vars = obj;
            }
        };

        this.fromRecordDetail = function() {
            parseRecordDetail().then(
                /**
                 * @param {Favorite} fav
                 */
                function(fav) { $vars = fav.toObject(); },
                /**
                 * @param {String} msg
                 */
                function(msg) { console.error(msg); }
            );
        };

        /**
         * @param {Number} rank
         */
        this.fromRecordSearch = function(rank) {
            parseRecordSearch(rank).then(
                /**
                 * @param {Favorite} fav
                 */
                function(fav) { $vars = fav.toObject(); },
                /**
                 * @param {String} msg
                 */
                function(msg) { console.error(msg); }
            );
        };

        /**
         * @returns {Object}
         */
        this.toObject = function() {
            return $vars;
        };

        /**
         * @returns {String}
         */
        this.toString = function() {
            return JSON.stringify($vars);
        };

        // Create getter/setters according to $vars
        $.each($vars, function(prop) {
            console.log(prop);
            if (prop == "created") {
                Object.defineProperty(this, prop, {
                    get: function() { return $vars[prop]; }
                });
            } else {
                Object.defineProperty(this, prop, {
                    get: function() { return $vars[prop]; },
                    set: function(v) { $vars[prop] = v; }
                });
            }
        });

        /**
         * @returns {Promise}
         */
        var parseRecordDetail = function() {
            return new Promise(function(resolve, reject) {
                var tablePointer = $("table[summary]");
                if (tablePointer.length === 0) {
                    reject("We are probably not on record detail page.");
                }

                var authorPointer = tablePointer.find('tbody tr td[property=author] a');

                if (authorPointer.length === 0) {
                    // Could also be a creator property
                    authorPointer = tablePointer.find("tbody tr td[property=creator] a");

                    if (authorPointer.length === 0) {
                        // Could also be an contributor
                        authorPointer = tablePointer.find("tbody tr td span[property=contributor] a");
                    }
                }

                var formatPointer = tablePointer.find("tbody tr td div.iconlabel");

                var fav = new favorites.Favorite();
                fav.titleLink = location.pathname;
                fav.title = (function() {
                    var expectedSiblingHeader = tablePointer.siblings("h2");
                    return (expectedSiblingHeader.length > 0)
                        ? expectedSiblingHeader.find("strong").text()
                        : console.error("Parsing record title failed!");
                })();
                fav.authorLink = (function() {
                    var link = authorPointer.prop("href");
                    return (typeof link === "string")
                        ? link
                        : console.error("Parsing author's link failed!");
                })();
                fav.author = (function() {
                    var author = authorPointer.text();
                    return (typeof author === "string")
                        ? author
                        : console.error("Parsing author's name failed!");
                })();
                fav.formatIconClass = (function() {
                    var expectedIcon = formatPointer.children("i");
                    return (expectedIcon.length)
                        ? expectedIcon.attr("class")
                        : console.error("Parsing format icon class failed!");
                })();
                fav.format = (function() {
                    var expectedSpan = formatPointer.children("span");
                    return (expectedSpan.length)
                        ? expectedSpan.attr("data-orig")
                        : console.error("Parsing record format failed!");
                })();
                fav.published = (function() {
                    var expectedSpan = tablePointer.find("tbody tr td span[property=publicationDate]");
                    return (expectedSpan.length)
                        ? expectedSpan.text()
                        : console.error("Parsing publication year failed!");
                })();
                fav.image = (function() {
                    var expectedParentSiblingSmallDivision = tablePointer.parent().siblings("div.col-sm-3");
                    if (expectedParentSiblingSmallDivision.length <= 0) {
                        return console.error("Parsing record image's parent division failed!");
                    }

                    var expectedImg = expectedParentSiblingSmallDivision.find("img");
                    if (expectedImg.length) {
                        // We found image
                        return expectedImg.attr("src");
                    }

                    // Parsing image has failed .. so try to parse an icon
                    var expectedIcon = expectedParentSiblingSmallDivision.find("i[class][style]");
                    if (expectedIcon.length <= 0) {
                        return console.error("Parsing record image source or icon failed!");
                    }

                    // Set at least the icon to the object
                    fav.icon = expectedIcon.attr("class");
                    fav.iconStyle = expectedIcon.attr("style");
                    // And image is undefined ..
                    return undefined;
                })();

                resolve(fav);
            });
        };

        /**
         * @returns {Promise}
         */
        var parseRecordSearch = function(rank) {
            return new Promise(function(resolve, reject) {
                if (typeof rank === "undefined") {
                    reject("Can not parse from current search with unknown rank!");
                }

                rank = parseInt(rank);

                if (rank < 0) {
                    reject("Invalid rank provided for parsing current search!");
                }

                /* $#[ */
                if (typeof $searchItems === "undefined") {
                    window.addEventListener("searchResultsLoaded", updateSearchItems);
                    updateSearchItems();
                }
                /* ]#$ */

                var record = $searchItems.get(rank);
                record = record.getElementsByClassName("row")[0];

                var fav = new Favorite();
                fav.title = (function() {
                    var anchor = record.querySelector("a.title");

                    if (anchor) {
                        this.titleLink = anchor.getAttribute("href");
                        return anchor.textContent.trim();
                    }

                    console.error("Parsing search record title and titleLink failed!");
                })();
                fav.author = (function() {
                    var anchor = record.querySelector("a.author-info");

                    if (anchor) {
                        this.authorLink = anchor.getAttribute("href");
                        return anchor.textContent.trim();
                    }

                    console.error("Parsing search record author and authorLink failed!");
                })();
                fav.format = (function() {
                    var iconDiv = record.querySelector("div.format-list div.iconlabel");

                    if (iconDiv) {
                        fav.formatIconClass(iconDiv.getElementsByTagName("i")[0].getAttribute("class"));

                        return iconDiv.getElementsByTagName("span")[0].getAttribute("data-orig");
                    }

                    console.error("Parsing format icon class failed!");
                    console.error("Parsing record format failed!");
                })();
                fav.published = (function() {
                    var span = record.querySelector("span.summDate");

                    if (span) {
                        return span.textContent.trim();
                    }

                    console.error("Parsing date of publishing failed!")
                })();
                fav.image = (function() {
                    var err = "Parsing image or icon failed!";
                    try {
                        var thumb = record.getElementsByClassName("coverThumbnail")[0];
                        var image = thumb.getElementsByTagName("img")[0];

                        if (typeof image !== "undefined") {
                            return image.getAttribute("src");
                        }

                        var icon = thumb.getElementsByTagName("i")[0];

                        if (typeof icon !== "undefined") {
                            fav.icon(icon.getAttribute("class"));
                            fav.iconStyle(icon.getAttribute("style"));
                            // Icon is set but image self is undefined
                            return undefined;
                        }

                        console.log(err);
                    } catch (e) {
                        console.error(err, e);
                    }
                })();

                resolve(fav);
            });
        };
    };

    /**
     * Prototype for favorites notifications service.
     * @constructor
     */
    var FavoritesNotifications = function() {
        console.log("Initializing FavoritesNotifications.");

        var $addedSomething = false,
            $notificationsEnabled = typeof __notif !== "undefined";

        console.log("Notifications are " + ($notificationsEnabled === true ? "ENABLED" : "DISABLED") + ".");

        /**
         * Notify that a new favorite were added.
         */
        this.favAdded = function() {
            if ($notificationsEnabled !== true) {
                return;
            }

            if ($addedSomething === false) {
                $addedSomething = true;
                createNotificationWarning();
            }
        };

        /**
         * Notify that all favorites were removed.
         */
        this.allFavsRemoved = function() {
            if ($notificationsEnabled !== true) {
                return;
            }

            __notif.helper.pointers.global.children(".notif-favs").remove();

            if (__notif.sourcesRead.unreadCount === 0) {
                $addedSomething = false;
                __notif.warning.hide();
                __notif.helper.pointers.global.children().first().show();
            }
        };

        /**
         * Creates warning about unsaved favorites.
         * @private
         */
        function createNotificationWarning() {
            var message = translate("you_have_unsaved_favorites");
            __notif.addNotification(message, "favs");
        }
    };

    /**
     * Prototype for favorites storage.
     * @param {String} storageType
     * @returns {FavoritesStorage}
     * @constructor
     */
    var FavoritesStorage = function(storageType) {
        console.log("Initializing FavoritesStorage with " + storageType + ".");

        var $storage = window[storageType];
        var $favorites = [];
        var $initializer = {
            done: false,
            buffer: []
        };

        // Ensure that storage has name set
        if (!($storage.hasOwnProperty("name") && $storage.name !== "undefined")) {
            console.log("Storage has no name - setting one...");
            Object.defineProperty($storage, "name", { get: function() { return "_favs"; } });
        }

        /**
         * Adds new favorite into the storage.
         * @param {Favorite} item
         * @returns {Promise|void}
         */
        this.add = function(item) {
            if ($storage === null) {
                return;
            }

            return new Promise(function(resolve, reject) {
                if (!(item instanceof Favorite)) {
                    reject("Invalid favorite provided (not an instance of Favorite class)!");
                }

                var job = function() {
                    save(item).then(resolve).catch(reject);
                };

                call(job);
                favorites.notifications.favAdded();
            });
        };

        /**
         * Removes favorite with given identifier.
         * @param {string} id
         * @returns {Promise|void}
         */
        this.remove = function(id) {
            if ($storage === null) {
                return;
            }

            return new Promise(function(resolve, reject) {
                if (typeof id !== "number") {
                    reject("Invalid Favorite ID provided!");
                    return;
                }

                var job = function() {
                    var count = $favorites.length,
                        tmp = [],
                        removed = false;

                    for (var i=0; i < count; ++i) {
                        if ($favorites[i].created === id) {
                            removed = true;
                        } else {
                            tmp.push($favorites[i]);
                        }
                    }

                    if (removed === false) {
                        reject("Invalid Favorite ID provided (no items were found)!");
                        return;
                    }

                    $favorites = tmp;

                    saveFavorites().then(resolve).catch(reject);

                    if ($favorites.length === 0) {
                        CPK.favorites.notifications.allFavsRemoved();
                    }
                };

                call(job);
            });
        };

        /**
         * Removes all favorites.
         * @returns {Promise|void}
         */
        this.removeAll = function() {
            if ($storage === null) {
                return;
            }

            return new Promise(function(resolve, reject) {
                $favorites = [];
                CPK.favorites.notifications.allFavsRemoved();
                saveFavorites().then(resolve).catch(reject);
            });
        };

        /**
         * Checks if favorite with given identifier exist.
         * @param {string} id
         * @returns {Promise|void}
         */
        this.has = function(id) {
            if ($storage === null) {
                return;
            }

            return new Promise(function(resolve, reject) {
                var job = function () {
                    var regexp = new RegExp("\/" + id.replace(/\./,"\\."));

                    if (!$favorites) {
                        reject();
                        return;
                    }

                    var found = favorites.find(function(fav) {
                        return !!fav.title.link.match(regexp);
                    });

                    if (typeof found === "undefined") {
                        reject();
                    } else {
                        resolve(new Favorite().fromObject(found));
                    }
                };

                call(job);
            });
        };

        /**
         * Get favorite by its identifier.
         * @param {string} id
         * @returns {Promise|void}
         */
        this.get = function(id) {
            if ($storage === null) {
                return;
            }

            return new Promise(function(resolve, reject) {
                if (typeof id !== "number" || id <= 0) {
                    reject("Can not get Favorite without an identifier.");
                }

                var job = function () {
                    /**
                     * @todo Tohle `favorite` se asi vytváří při parsování výsledků vyhledávání...
                     */
                    var favObj = favorite[id];

                    favorites.notifications.favAdded();

                    resolve(new favorites.Favorite().fromObject(favObj));
                };

                call(job);
            });
        };

        /**
         * Get all saved favorites.
         * @returns {Promise|void}
         */
        this.getAll = function() {
            if ($storage === null) {
                return;
            }

            return new Promise(function(resolve, reject) {
                var job = function() {
                    resolve($favorites.map(function(fav) {
                        favorites.notifications.favAdded();

                        return new Favorite().fromObject(fav);
                    }));
                };

                call(job);
            });
        };

        /**
         * @private Save Favorite into the storage.
         * @param {Favorite} item
         * @returns {Promise}
         */
        function save(item) {
            return new Promise(function(resolve, reject) {
                $favorites.push(item.toObject());
                saveFavorites().then(resolve).catch(reject);
            });
        }

        /**
         * @private Save all favorites.
         * @returns {Promise}
         */
        function saveFavorites() {
            return new Promise(function(resolve, reject) {
                var job = function() {
                    var retVal = undefined;

                    if ($favorites.length) {
                        retVal = $storage.setItem($storage.name, JSON.stringify($favorites));
                    } else {
                        $storage.removeItem($storage.name);
                    }

                    resolve(retVal);
                };

                // create async call
                setTimeout(job, 0)
            });
        }

        /**
         * @private Helper function for calling jobs.
         * @param {Function} func
         */
        function call(func) {
            if (typeof func === "function") {
                if ($initializer.done) {
                    func.call();
                }
            } else {
                $initializer.buffer.push(func);
            }
        }

        return this;
    };

    /**
     * Initialize favorites
     * @type {Object}
     */
    CPK.favorites = {};
    /**
     * @type {Favorite}
     */
    CPK.favorites.Favorite = Favorite;
    /**
     * @type {Array}
     */
    CPK.favorites.available = [];
    /**
     * @type {FavoritesNotifications}
     */
    CPK.favorites.notifications = new FavoritesNotifications();
    /**
     * @type {FavoritesStorage}
     */
    CPK.favorites.storage = new FavoritesStorage($usedStorageType);

}(jQuery));