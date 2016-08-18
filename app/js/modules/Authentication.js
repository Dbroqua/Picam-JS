/**
 * Created by dbroqua on 8/17/16.
 */

angular.module('Authentication')
    .controller('AuthenticationController', ['$rootScope', '$scope', '$location', 'HTTPService',
        function ($rootScope, $scope, $location, HTTPService) {
            'use strict';
            $rootScope.title = TITLEPrefix + 'Login';
            $rootScope.bodyClass = 'signin';

            $scope.$on('$destroy',function(){
                $rootScope.bodyClass = '';
            });

            $scope.username = '';
            $scope.password = '';
            $scope.message = {
                'class': 'alert-danger',
                'message': null
            };

            $scope.login = function () {
                $scope.message.message = null;
                if ($scope.username !== '' && $scope.password !== '') {
                    HTTPService.login($scope.username, $scope.password,
                        function () {
                            $location.path('/Home/');
                        }, function (error) {
                            if (error !== null && error.status !== undefined) {
                                switch (error.status) {
                                    case 401:
                                        $scope.message.message = '<strong>Error !</strong> Bad logins';
                                        break;
                                    default:
                                        $scope.message.message = '<strong>Error !</strong> Unknown error';
                                }
                            } else {
                                $scope.message.message = '<strong>Error !</strong> Server downn ?';
                            }
                        });
                }
                else {
                    $scope.message.message = '<strong>Error !</strong> Malformated form';
                }
            };
        }
    ]);