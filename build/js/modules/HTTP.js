/**
 * Created by dbroqua on 8/17/16.
 */

angular.module('Network', [])
    .factory('HTTPService', ['$rootScope', '$http', '$base64', '$cookies', '$q', '$ngBootbox',
        function($rootScope, $http, $base64, $cookies, $q, $ngBootbox) {
            var http_service = {
                authDatas: $cookies.get('PiCam') || null,
                userData: null,
                getAll_cancel: {},
                getOne_cancel: {}
            };

            http_service.isLogged = function() {
                return (http_service.authDatas !== null);
            };

            http_service.initEnv = function() {
                $http.defaults.headers.common.Authorization = 'Basic ' + http_service.authDatas;
            };

            //All request return a promise that can be resolved to cancel this request
            http_service.get = function(url, data, callback, promise) {
                var canceler = promise ? promise : $q.defer();
                if (!data || data === null) {
                    data = {
                        timeout: canceler.promise
                    };
                } else {
                    data.timeout = canceler.promise;
                }
                $http.get(SERVER_PATH + url, data).then(callback, callback);
                return canceler;
            };
            http_service.getRemote = function(url, data, callback, promise) {
                var canceler = promise ? promise : $q.defer(),
                    req = {
                        method: 'GET',
                        url: url,
                        data: null
                    };

                if (!data || data === null) {
                    data = {
                        timeout: canceler.promise
                    };
                } else {
                    data.timeout = canceler.promise;
                }

                req.data = data;
                $http(req).then(callback, callback);
                return canceler;
            };

            http_service.patch = function(url, id, data, callback) {
                $http.patch(SERVER_PATH + url + '/' + id, data).then(callback, callback);
            };

            http_service.post = function(url, data, callback) {
                $http.post(SERVER_PATH + url + '/', data).then(callback, callback);
            };

            http_service.delete = function(url, id, msg, callback) {
                var _msg = msg;
                if (callback === undefined) {
                    callback = msg;
                    _msg = 'Are you sure to want delete this element ?';
                }
                $ngBootbox.confirm(_msg)
                    .then(function() {
                        $http.delete(SERVER_PATH + url + '/' + id).then(callback, callback);
                    }, function() {
                        console.log('Confirm dismissed!');
                    });
            };


            /**
             * Retrieved from : https://github.com/xelita/angular-basic-auth
             * Generate a basic authorization header based on the given username and password.
             *
             * @param {String} username the user name
             * @param {String} password the user password
             * @returns {String} Basic authorization header (eg. 'Basic dGVzdA==')
             */
            http_service.generateAuthorizationHeader = function(username, password) {
                return $base64.encode(username + ':' + password);
            };

            http_service.login = function(userName, password, success, failure) {
                var authData = this.generateAuthorizationHeader(userName, password);
                $http.defaults.headers.common.Authorization = 'Basic ' + authData;
                // Post the login request to the backend server in order to validate them
                $http.post(APIUri + 'authenticate', {
                    username: userName,
                    password: password
                }).then(function(response) {
                    // Store authorization header as default authorization header for further queries
                    var userData = response.data;
                    http_service.authDatas = authData;
                    http_service.userData = userData;
                    console.log(userData);
                    $rootScope.apikey = userData.apikey;
                    // Delegate response to the caller (afterSuccess hook)
                    if (success) {
                        $cookies.put('PiCam', authData);
                        success();
                    }
                }, function(error) {
                    // Delegate response to the caller (afterFailure hook)
                    if (failure) {
                        failure(error);
                    }
                });
            };
            http_service.relogin = function(success, failure) {
                if (http_service.userData === null) {
                    // Post the login request to the backend server in order to validate them
                    $http.post(APIUri + 'authenticate', null).then(function(response) {
                        // Store authorization header as default authorization header for further queries
                        http_service.userData = response.data;
                        $rootScope.apikey = response.data.apikey;
                        if (success) {
                            success();
                        }
                    }, function(error) {
                        // Delegate response to the caller (afterFailure hook)
                        if (failure) {
                            failure(error);
                        }
                    });
                }
            };

            http_service.logout = function(success) {
                http_service.authDatas = null;
                $cookies.remove('PiCam');
                $http.defaults.headers.common.Authorization = null;
                success();
            };

            http_service.parseFilters = function(filters) {
                var urlAppendix = '',
                    prop;

                for (prop in filters) {
                    if (Array.isArray(filters[prop].values)) {
                        //Avoid passing an empty, this will produce a not acceptable request
                        if (filters[prop].values.length > 0) {
                            if (urlAppendix !== '') {
                                urlAppendix += '&';
                            }
                            urlAppendix += 'q.' + filters[prop].name + '.' + filters[prop].func + '=' + filters[prop].values;
                        }
                    } else {
                        if (filters[prop].values !== 'null' && filters[prop].values !== '') {
                            if (urlAppendix !== '') {
                                urlAppendix += '&';
                            }
                            urlAppendix += 'q.' + filters[prop].name + '.' + filters[prop].func + '=' + filters[prop].values;
                        }
                    }
                }
                return urlAppendix;
            };

            http_service.getAll = function(route, extraRoute, limit, page, filters, sort, callback) {
                var sorting = '',
                    _route = route + extraRoute;

                if (http_service.getAll_cancel[route]) {
                    http_service.getAll_cancel[route].resolve();
                    http_service.getAll_cancel[route] = undefined;
                }
                if (typeof sort === Object) {
                    sorting = sort.id;
                    if (!sort.asc) {
                        sorting = '-' + sorting;
                    }
                }

                _route += '?limit=' + limit + '&page=' + page + '&sort=' + sorting + '&';

                http_service.getAll_cancel[route] = http_service.get(_route + http_service.parseFilters(filters), null, callback, http_service.getAll_cancel[route]);
            };

            http_service.getAllRemote = function(params, identifier, callback) {
                var sorting = params.sort.col;

                if (http_service.getAll_cancel[identifier]) {
                    http_service.getAll_cancel[identifier].resolve();
                    http_service.getAll_cancel[identifier] = undefined;
                }

                if (!params.sort.dir) {
                    sorting = '-' + sorting;
                }

                http_service.getAll_cancel[identifier] = http_service.getRemote(params.scheme + '://' + params.uri + ':' + params.port + '/api/v1/cameras/' + '?apikey=' +
                    params.apikey + '&sort=' + sorting, params, callback, http_service.getAll_cancel[identifier]);
            };

            http_service.getOne = function(route, id, params, callback) {
                if (http_service.getOne_cancel[route]) {
                    http_service.getOne_cancel[route].resolve();
                    http_service.getOne_cancel[route] = undefined;
                }

                http_service.getOne_cancel[route] = http_service.get(route + '/' + id + '?' + params, null, callback, http_service.getOne_cancel[route]);
            };

            http_service.returnPagination = function(totalRows, limit, currentPage) {
                var nbPages = Math.ceil(totalRows / (limit > 0 ? limit : 1)),
                    pagin = {
                        list: [],
                        nbPages: nbPages,
                        currentPage: currentPage
                    },
                    i,
                    currentIndex;

                for (i = 0; i < nbPages; i++) {
                    currentIndex = (i + 1);
                    pagin.list.push({
                        index: currentIndex,
                        active: (currentPage === currentIndex)
                    });
                }
                return pagin;
            };

            return http_service;
        }
    ])
    .directive('pagination', function() {
        return {
            restrict: 'E',
            scope: {
                pagination: '=pages'
            },
            templateUrl: 'templates/pagination.html'
        };
    });