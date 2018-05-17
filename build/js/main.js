/**
 * Created by dbroqua on 8/17/16.
 */

angular.module('Network', []);
angular.module('HomePage', []);
angular.module('Authentication', []);
angular.module('Cameras', []);
angular.module('Camera', []);
angular.module('Users', []);
angular.module('User', []);

//App
angular.module('PiCam', [
        'toastr',
        'ngRoute',
        'ngCookies',
        'ngBootbox',
        'base64',

        'Network',
        'Authentication',
        'HomePage',
        'Cameras',
        'Camera',
        'Users',
        'User'
    ])
    //Redirections
    .config([
        '$routeProvider', '$locationProvider',
        function($routeProvider, $locationProvider) {
            $routeProvider
                .when('/home/', {
                    templateUrl: 'modules/HomePage/default.html',
                    controller: 'HomePageController'
                })

                .when('/cameras', {
                    templateUrl: 'modules/Cameras/default.html',
                    controller: 'CamerasController'
                })
                .when('/cameras/:id', {
                    templateUrl: 'modules/Cameras/camera.html',
                    controller: 'CameraController'
                })
                .when('/cameras/:id/stream', {
                    templateUrl: 'modules/Cameras/stream.html',
                    controller: 'CameraStreamController'
                })
                .when('/cameras/:id/files', {
                    templateUrl: 'modules/Cameras/files.html',
                    controller: 'CameraFilesController'
                })

                .when('/administration/users', {
                    templateUrl: 'modules/Users/default.html',
                    controller: 'UsersController'
                })
                .when('/administration/users/:id', {
                    templateUrl: 'modules/Users/user.html',
                    controller: 'UserController'
                })

                .when('/login', {
                    templateUrl: 'modules/Authentication/default.html',
                    controller: 'AuthenticationController'
                })

                .otherwise({
                    redirectTo: '/home'
                });

            $locationProvider.html5Mode(true);
        }
    ])
    //RootScope control
    .run(['$rootScope', '$location', 'HTTPService', 'breadcrumbs',
        function($rootScope, $location, HTTPService, breadcrumbs) {
            $rootScope.bodyClass = '';
            $rootScope.isLogged = false;
            $rootScope.SERVER_PATH = SERVER_PATH;
            $rootScope.apikey = null;
            $rootScope.containerClass = '';
            $rootScope.breadcrumbs = breadcrumbs;

            $rootScope.logOut = function() {
                HTTPService.logout(function() {
                    $rootScope.isLogged = false;
                    $location.path('/login/');
                });
            };

            /**
             * Check if route contains pattern (used in nav menu)
             * @param  {String} pattern
             * @returns {Boolean}
             */
            $rootScope.routeContains = function(pattern) {
                var currentRoot = $location.path();
                return currentRoot.indexOf(pattern) >= 0;
            };

            // First function called when start navigation
            $rootScope.$on('$locationChangeStart',
                function() {
                    $rootScope.isLogged = HTTPService.isLogged();
                    if ($rootScope.isLogged) {
                        HTTPService.initEnv();
                        HTTPService.relogin(function(success, failure) {
                            if (failure) {
                                $rootScope.logOut();
                            }
                        });
                    } else if ($location.path() !== '/login' && !$rootScope.isLogged) {
                        $location.path('/login/');
                    }
                }
            );
        }
    ])
    .factory('breadcrumbs', ['$rootScope', '$location', function($rootScope, $location) {
        var breadcrumbs = [],
            breadcrumbsService = {};

        $rootScope.$on('$routeChangeSuccess', function(event, current) {
            var pathElements = $location.path().split('/'),
                result = [],
                i;

            var breadcrumbPath = function(index) {
                return '/' + (pathElements.slice(0, index + 1)).join('/');
            };

            pathElements.shift();
            for (i = 0; i < pathElements.length; i++) {
                result.push({
                    name: pathElements[i].charAt(0).toUpperCase() + pathElements[i].slice(1),
                    path: breadcrumbPath(i)
                });
            }

            if (result[0].path != '/home') {
                result.unshift({
                    name: 'Home',
                    path: '/home'
                });
            }

            breadcrumbs = result;
        });

        breadcrumbsService.getAll = function() {
            return breadcrumbs;
        };

        return breadcrumbsService;
    }]);