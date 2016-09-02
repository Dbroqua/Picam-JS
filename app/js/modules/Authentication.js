/**
 * Created by dbroqua on 8/17/16.
 */

angular.module('Authentication')
    .controller('AuthenticationController', ['$rootScope', '$scope', '$location', 'HTTPService',
        function ($rootScope, $scope, $location, HTTPService) {
            'use strict';
            $rootScope.title = TITLEPrefix + 'Login';
            $rootScope.bodyClass = 'signin';
            $scope.message = null;

            $scope.$on('$destroy',function(){
                $rootScope.bodyClass = '';
            });

            $scope.username = '';
            $scope.password = '';

            $scope.login = function () {
                $scope.message = null;
                if ($scope.username !== '' && $scope.password !== '') {
                    HTTPService.login($scope.username, $scope.password,
                        function () {
                            $location.path('/cameras/');
                        }, function (error) {
                            if (error !== null && error.status !== undefined) {
                                switch (error.status) {
                                    case 401:
                                        $scope.message = 'Bad login';
                                        break;
                                    default:
                                        $scope.message = 'Unknown error';
                                }
                            } else {
                                $scope.message = 'Server downn ?';
                            }
                        });
                }
                else {
                    $scope.message = '<strong>Error !</strong> Malformated form';
                }
            };
        }
    ]);