/**
 * Created by dbroqua on 8/18/16.
 */

angular.module('Camera')
    .controller('CameraController',
        ['$rootScope', '$scope', '$location', '$routeParams', 'HTTPService', 'toastr', '$ngBootbox',
            function ($rootScope, $scope, $location, $routeParams, HTTPService, toastr, $ngBootbox) {
                $rootScope.title = TITLEPrefix + 'Camera';
                $scope.Camera = {};
                $scope.updatedValues = {};
                $scope.cameraId = null;
                $scope.remoteCameras = [];
                $scope.showEditableValues = false;

                $scope.$watch('[updatedValues.type,updatedValues.definition.uri,updatedValues.definition.scheme,updatedValues.definition.port,updatedValues.definition.login,updatedValues.definition.password]', function () {
                    if ($scope.updatedValues.type === 'Net') {
                        if ($scope.updatedValues.definition.uri !== undefined) {
                            if (!Number($scope.updatedValues.port)) {
                                $scope.updatedValues.port = 80;
                            }

                            HTTPService.getAllRemote({
                                scheme: $scope.updatedValues.definition.scheme,
                                uri: $scope.updatedValues.definition.uri,
                                port: $scope.updatedValues.definition.port,
                                login: $scope.updatedValues.definition.login,
                                password: $scope.updatedValues.definition.password,
                                sort: {
                                    col: 'name',
                                    dir: 'asc'
                                }
                            }, 'getRemote', function (response) {
                                console.log('Response : ', response);
                                if (response.status === 200) {
                                    $scope.remoteCameras = response.data.resources;
                                    console.log(response, $scope.remoteCameras);
                                }
                            });
                        }
                    }
                });

                $scope.showForm = function () {
                    $scope.showEditableValues = !($scope.showEditableValues);
                };

                $scope.patchCamera = function (id, values) {
                    HTTPService.patch('cameras', id, values, function (response) {
                        if (response.status === 200) {
                            toastr.success('Action completed');
                            $scope.load();
                        } else {
                            toastr.error("Can't complete this operation");
                        }
                    });
                };

                $scope.updateCamera = function () {
                    delete $scope.updatedValues.infos;
                    var preventEmptyPassword = false;

                    var _runAction = function () {
                        if ($routeParams.id !== 'add') {
                            // Update camera
                            HTTPService.patch('cameras', $scope.cameraId, $scope.updatedValues, function (response) {
                                if (response.status === 200) {
                                    toastr.success('Action completed');
                                    $scope.load();
                                } else {
                                    toastr.error("Can't complete this operation");
                                }
                            });
                        } else {
                            // Create new camera
                            HTTPService.post('cameras', $scope.updatedValues, function (response) {
                                if (response.status === 201) {
                                    toastr.success('New camera created');
                                    $location.path('/cameras/' + response.data._id);
                                } else {
                                    switch (response.status) {
                                        case 409:
                                            toastr.error("Can't create new camera because this name is already in use");
                                            break;
                                        default:
                                            toastr.error("Can't create new camera");
                                    }
                                }
                            });
                        }
                    };

                    if ($scope.updatedValues.type === 'Net' && $scope.updatedValues.definition !== undefined && ( $scope.updatedValues.definition.password === undefined || $scope.updatedValues.definition.password.length === 0 )) {
                        preventEmptyPassword = true;
                    }

                    if ($scope.updatedValues.type === 'Local' && $scope.updatedValues.definition !== undefined && $scope.updatedValues.definition.motion !== undefined && ( $scope.updatedValues.definition.motion.password === undefined || $scope.updatedValues.definition.motion.password.length === 0 )) {
                        preventEmptyPassword = true;
                    }

                    if (preventEmptyPassword === false) {
                        _runAction();
                    } else {
                        $ngBootbox.confirm('No password set, are you sure?')
                            .then(function () {
                                _runAction();
                            }, function () {
                                console.log('Confirm dismissed!');
                            });
                    }
                };

                $scope.deleteCamera = function(){
                    HTTPService.delete('cameras', $scope.cameraId, $scope.updatedValues, function (response) {
                        if (response.status === 200) {
                            toastr.success('Camera deleted');
                            $location.path('/cameras/');
                        } else {
                            toastr.error("Can't remove this camera");
                        }
                    });
                };

                $scope.load = function () {
                    $scope.Camera = {};

                    if ($routeParams.id !== 'add') {
                        $scope.cameraId = $routeParams.id;
                        HTTPService.getOne('cameras', $routeParams.id, null, function (response) {
                            $scope.loadingList = false;
                            if (response.status === 200) {
                                $scope.Camera = response.data;
                                $scope.updatedValues = response.data;
                                delete $scope.updatedValues._id;
                                $rootScope.title = TITLEPrefix + $scope.Camera.name;
                            } else {
                                switch (response.status) {
                                    case 401:
                                        toastr.error('Not authorized');
                                        break;
                                    case 404:
                                        toastr.error('Camera not found');
                                        break;
                                    case 500:
                                        toastr.error('Internal server error');
                                        break;
                                    default:
                                        toastr.error('Can\'t show this camera');
                                }
                            }
                        });

                    } else {
                        $scope.Camera = {
                            name: 'New camera',
                            type: 'Local',
                            definition: {
                                "filesDirectory": "/media/freebox",
                                "fileIntrustion": "/media/freebox/intrusion.date",
                                "motion": {
                                    "id": 0,
                                    "adminUri": "http://127.0.0.1:8081/0/detection/",
                                    "streamUri": "http://127.0.0.1:8082/",
                                    "login": "user",
                                    "password": "password"
                                }
                            }
                        };
                        $scope.updatedValues = $scope.Camera;
                        $scope.showEditableValues = true;
                    }
                };

                $scope.load();
            }
        ]
    );