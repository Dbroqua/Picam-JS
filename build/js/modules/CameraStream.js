/**
 * Created by dbroqua on 9/2/16.
 */

angular.module('Camera')
    .controller('CameraStreamController',
        ['$rootScope', '$scope', '$location', '$routeParams', 'HTTPService', 'toastr',
            function ($rootScope, $scope, $location, $routeParams, HTTPService, toastr) {
                $rootScope.title = TITLEPrefix + 'Camera Stream';
                $scope.Camera = {};
                $scope.cameraId = null;

                $scope.load = function () {
                    $scope.Camera = {};

                    $scope.cameraId = $routeParams.id;
                    HTTPService.getOne('cameras', $routeParams.id, null, function (response) {
                        $scope.loadingList = false;
                        if (response.status === 200) {
                            $scope.Camera = response.data;
                            $rootScope.title = TITLEPrefix + $scope.Camera.name + ' stream';
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
                };

                $scope.load();
            }
        ]
    );