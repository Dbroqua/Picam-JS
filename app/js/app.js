/**
 * Created by dbroqua on 8/17/16.
 */

angular.module('Network', []);
angular.module('HomePage', []);
angular.module('Authentication', []);
angular.module('Cameras', []);
angular.module('Camera', []);

//App
angular.module('PiCam',
    [
        'toastr',
        'ngRoute',
        'ngCookies',
        'ngBootbox',
        'base64',

        'Network',
        'Authentication',
        'HomePage',
        'Cameras',
        'Camera'
    ])
//Redirections
    .config([
        '$routeProvider',
        function ($routeProvider) {
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

                .when('/login', {
                    templateUrl: 'modules/Authentication/default.html',
                    controller: 'AuthenticationController'
                })

                .otherwise({
                    redirectTo: '/Home/'
                });
        }])
    //RootScope control
    .run(['$rootScope', '$location', 'HTTPService',
        function ($rootScope, $location, HTTPService) {
            $rootScope.bodyClass = '';
            $rootScope.isLogged = false;
            $rootScope.SERVER_PATH = SERVER_PATH;
            $rootScope.apikey = null;

            $rootScope.logOut = function () {
                HTTPService.logout(function () {
                    $rootScope.isLogged = false;
                    $location.path('/login/');
                });
            };

            //Change the route to trigger the route dispatcher
            $rootScope.changeRoute = function (path) {
                if ($location.path() !== path) {
                    $location.path(path);
                    return true;
                }
                return false;
            };
            //Check root
            $rootScope.routeContains = function (pattern) {
                var currentRoot = $location.path();
                return currentRoot.indexOf(pattern) >= 0;
            };

            // First function called when start navigation
            $rootScope.$on('$locationChangeStart',
                function () {
                    $rootScope.isLogged = HTTPService.isLogged();
                    if ($rootScope.isLogged) {
                        HTTPService.initEnv();
                        HTTPService.relogin();
                    } else if ($location.path() !== '/login' && !$rootScope.isLogged) {
                        $location.path('/login/');
                    }
                }
            );
        }]
    );