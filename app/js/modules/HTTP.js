/**
 * Created by dbroqua on 8/17/16.
 */

angular.module("Network", [])
    .factory('HTTPService', ['$rootScope', '$http', '$base64', '$cookies', '$q', '$ngBootbox',
        function ($rootScope, $http, $base64, $cookies, $q, $ngBootbox) {
            var http_service = {
                authDatas: $cookies.get('AssetManager') || null,
                userData: null,
                getAll_cancel: {},
                getOne_cancel: {}
            };

            http_service.isLogged = function () {
                return ( http_service.authDatas !== null );
            };

            http_service.initEnv = function () {
                $http.defaults.headers.common.Authorization = 'Basic ' + http_service.authDatas;
            };

            //All request return a promise that can be resolved to cancel this request
            http_service.get = function (url, data, callback, promise) {
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
            http_service.getRemote = function (url, data, callback, promise) {
                var canceler = promise ? promise : $q.defer();
                if (!data || data === null) {
                    data = {
                        timeout: canceler.promise
                    };
                } else {
                    data.timeout = canceler.promise;
                }

                var req = {
                    method: 'GET',
                    url: url,
                    data: data
                };

                $http(req).then(callback, callback);
                return canceler;
            };

            http_service.patch = function (url, id, data, callback) {
                $http.patch(SERVER_PATH + url + '/' + id, data).then(callback, callback);
            };

            http_service.post = function (url, data, callback) {
                $http.post(SERVER_PATH + url + '/', data).then(callback, callback);
            };

            http_service.delete = function (url, id, data, callback) {
                $ngBootbox.confirm('Are you sure to want delete this element ?')
                    .then(function () {
                        $http.delete(SERVER_PATH + url + '/' + id, data).then(callback, callback);
                    }, function () {
                        console.log('Confirm dismissed!');
                    });
            };


            /**
             * Retrieved from : https://github.com/xelita/angular-basic-auth
             * Generate a basic authorization header based on the given username and password.
             * @param username the user name
             * @param password the user password
             * @return a basic authorization header (eg. 'Basic dGVzdA==')
             */
            http_service.generateAuthorizationHeader = function (username, password) {
                return $base64.encode(username + ':' + password);
            };

            http_service.login = function (userName, password, success, failure) {
                var authData = this.generateAuthorizationHeader(userName, password);
                $http.defaults.headers.common.Authorization = 'Basic ' + authData;
                // Post the login request to the backend server in order to validate them
                $http.post(APIUri + 'authenticate', {username: userName, password: password}).then(function (response) {
                    // Store authorization header as default authorization header for further queries
                    var userData = response.data;
                    http_service.authDatas = authData;
                    http_service.userData = userData;
                    console.log(userData);
                    $rootScope.apikey = userData.apikey;
                    // Delegate response to the caller (afterSuccess hook)
                    if (success) {
                        $cookies.put('AssetManager', authData);
                        success();
                    }
                }, function (error) {
                    // Delegate response to the caller (afterFailure hook)
                    if (failure) {
                        failure(error);
                    }
                });
            };
            http_service.relogin = function (success, failure) {
                if (http_service.userData === null) {
                    // Post the login request to the backend server in order to validate them
                    $http.post(APIUri + 'authenticate', null).then(function (response) {
                        // Store authorization header as default authorization header for further queries
                        http_service.userData = response.data;
                        $rootScope.apikey = response.data.apikey;
                        if (success) {
                            success();
                        }
                    }, function (error) {
                        // Delegate response to the caller (afterFailure hook)
                        if (failure) {
                            failure(error);
                        }
                    });
                }
            };

            http_service.logout = function (success) {
                http_service.authDatas = null;
                $cookies.remove('AssetManager');
                $http.defaults.headers.common.Authorization = null;
                success();
            };

            http_service.parseFilters = function (filters) {
                var urlAppendix = '';
                for (var prop in filters) {
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

            http_service.getAll = function (route, limit, page, filters, sort, callback) {
                if (http_service.getAll_cancel[route]) {
                    http_service.getAll_cancel[route].resolve();
                    http_service.getAll_cancel[route] = undefined;
                }
                var sorting = sort.id;
                if (!sort.asc) {
                    sorting = '-' + sorting;
                }

                http_service.getAll_cancel[route] = http_service.get(route + '?limit=' + limit + '&page=' + page + '&sort=' + sorting + '&' + http_service.parseFilters(filters), null, callback, http_service.getAll_cancel[route]);
            };

            http_service.getAllRemote = function (params, identifier, callback) {
                if (http_service.getAll_cancel[identifier]) {
                    http_service.getAll_cancel[identifier].resolve();
                    http_service.getAll_cancel[identifier] = undefined;
                }
                var sorting = params.sort.col;
                if (!params.sort.dir) {
                    sorting = '-' + sorting;
                }

                http_service.getAll_cancel[identifier] = http_service.getRemote(params.scheme + '://' + params.uri + ':' + params.port + '/api/v1/cameras/' + '?apikey='+params.apikey+'&sort=' + sorting, params, callback, http_service.getAll_cancel[identifier]);
            };

            http_service.getOne = function (route, id, params, callback) {
                if (http_service.getOne_cancel[route]) {
                    http_service.getOne_cancel[route].resolve();
                    http_service.getOne_cancel[route] = undefined;
                }

                http_service.getOne_cancel[route] = http_service.get(route + '/' + id + '?' + params, null, callback, http_service.getOne_cancel[route]);
            };

            http_service.returnPagination = function (totalRows, limit, currentPage) {
                var nbPages = Math.ceil(totalRows / (limit > 0 ? limit : 1 ));
                var pagin = {
                    list: [],
                    nbPages: nbPages,
                    currentPage: currentPage
                };
                for (var i = 0; i < nbPages; i++) {
                    var currentIndex = (i + 1);
                    pagin.list.push({
                        index: currentIndex,
                        active: ( currentPage === currentIndex )
                    });
                }
                return pagin;
            };

            return http_service;
        }
    ])
    .directive('pagination', function () {
        return {
            restrict: 'E',
            template: '<ul class="pagination">' +
            '   <li ng-class="{disabled: pagination.currentPage === 1}">' +
            '       <a ng-click="pagination.currentPage > 1 && switchToPage( pagination.currentPage - 1 )" aria-label="Previous">' +
            '           <span aria-hidden="true">&laquo;</span>' +
            '       </a>' +
            '   </li>' +
            '   <li ng-class="{active : p.active}" ng-repeat="p in pagination.list">' +
            '       <a ng-click="switchToPage(p.index)">{{p.index}}</a>' +
            '   </li>' +
            '   <li ng-class="{disabled: pagination.currentPage === pagination.nbPages}">' +
            '       <a ng-click="pagination.currentPage < pagination.nbPages && switchToPage(pagination.currentPage + 1)" aria-label="Next">' +
            '           <span aria-hidden="true">&raquo;</span>' +
            '       </a>' +
            '   </li>' +
            '</ul>'
        };
    })