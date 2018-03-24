/**
 * Created by dbroqua on 8/18/16.
 */

angular.module('User')
    .controller('UserController', ['$rootScope', '$scope', '$location', '$routeParams', 'HTTPService', 'toastr', '$ngBootbox',
        function($rootScope, $scope, $location, $routeParams, HTTPService, toastr, $ngBootbox) {
            $rootScope.title = TITLEPrefix + 'User';
            $scope.User = {};
            $scope.updatedValues = {};
            $scope.userId = null;

            $scope.patchUser = function(id, values) {
                HTTPService.patch('users', id, values, function(response) {
                    if (response.status === 200) {
                        toastr.success('Action completed');
                        $scope.load();
                    } else {
                        toastr.error("Can't complete this operation");
                    }
                });
            };

            $scope.updateUser = function() {
                delete $scope.updatedValues.infos;
                var preventEmptyPassword = false;

                var _runAction = function() {
                    if ($routeParams.id !== 'add') {
                        // Update user
                        HTTPService.patch('users', $scope.userId, $scope.updatedValues, function(response) {
                            if (response.status === 200) {
                                toastr.success('Action completed');
                                $scope.load();
                            } else {
                                toastr.error("Can't complete this operation");
                            }
                        });
                    } else {
                        // Create new user
                        HTTPService.post('users', $scope.updatedValues, function(response) {
                            if (response.status === 201) {
                                toastr.success('New user created');
                                $location.path('/administration/users/' + response.data._id);
                            } else {
                                switch (response.status) {
                                    case 409:
                                        toastr.error("Can't create new user because this email or this apikey is already in use");
                                        break;
                                    default:
                                        toastr.error("Can't create new user");
                                }
                            }
                        });
                    }
                };

                if ($routeParams.id === 'add' && $scope.updatedValues.password.length === 0) {
                    preventEmptyPassword = true;
                }

                if (preventEmptyPassword === false) {
                    _runAction();
                } else {
                    $ngBootbox.confirm('No password set, are you sure?')
                        .then(function() {
                            _runAction();
                        }, function() {
                            console.log('Confirm dismissed!');
                        });
                }
            };

            $scope.deleteUser = function() {
                HTTPService.delete('users', $scope.userId, $scope.updatedValues, function(response) {
                    if (response.status === 200) {
                        toastr.success('User deleted');
                        $location.path('/administration/users/');
                    } else {
                        toastr.error("Can't remove this user");
                    }
                });
            };

            $scope.generateApiKey = function() {
                let generateApiKey = "",
                    _possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*-_=+";

                for (let _i = 0; _i < 32; _i++) {
                    generateApiKey += _possible.charAt(Math.floor(Math.random() * _possible.length));
                }

                $scope.updatedValues.apikey = generateApiKey;
            };

            $scope.load = function() {
                $scope.User = {};

                if ($routeParams.id !== 'add') {
                    $scope.userId = $routeParams.id;
                    HTTPService.getOne('users', $routeParams.id, null, function(response) {
                        $scope.loadingList = false;
                        if (response.status === 200) {
                            $scope.User = response.data;
                            $scope.updatedValues = response.data;
                            delete $scope.updatedValues._id;
                            $rootScope.title = TITLEPrefix + $scope.User.first_name + $scope.User.last_name;
                        } else {
                            switch (response.status) {
                                case 401:
                                    toastr.error('Not authorized');
                                    break;
                                case 404:
                                    toastr.error('User not found');
                                    break;
                                case 500:
                                    toastr.error('Internal server error');
                                    break;
                                default:
                                    toastr.error('Can\'t show this user');
                            }
                        }
                    });

                } else {
                    $scope.User = {};
                    $scope.updatedValues = {};
                    $scope.generateApiKey();
                    $scope.showEditableValues = true;
                }
            };

            $scope.load();
        }
    ]);