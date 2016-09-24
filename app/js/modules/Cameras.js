/**
 * Created by dbroqua on 8/17/16.
 */

angular.module('Cameras')
    .controller('CamerasController',
        ['$rootScope', '$scope', '$location', 'HTTPService', 'toastr',
            function ($rootScope, $scope, $location, HTTPService, toastr) {
                $rootScope.title = TITLEPrefix + 'Cameras';
                $scope.Cameras = [];
                $scope.limit = LIMIT;
                $scope.currentPage = 1;
                $scope.pagination = [];
                $scope.loadingList = false;

                $scope.patchCamera = function(id, values){
                    var cameraIndex = 0;
                    var nbCams = $scope.Cameras.length;
                    for( var i = 0 ; i < nbCams ; i++ ){
                        if( $scope.Cameras[i]._id === id ){
                            cameraIndex = i;
                            $scope.Cameras[cameraIndex].isLoading = true;
                            break;
                        }
                    }

                    HTTPService.patch('cameras', id, values, function (response) {
                        if (response.status === 200) {
                            toastr.success('Action completed');
                            HTTPService.getOne('cameras', id, null, function (response) {
                                $scope.Cameras[cameraIndex].isLoading = false;
                                if (response.status === 200) {
                                    $scope.Cameras[cameraIndex] = response.data;
                                } else {
                                    switch (response.status) {
                                        case 401:
                                            toastr.error('Not authorized');
                                            break;
                                        case 404:
                                            toastr.error('Camera not found, wut ?');
                                            break;
                                        case 500:
                                            toastr.error('Internal server error while trying reload camera details');
                                            break;
                                        default:
                                            toastr.error('Can\'t reload details for this camera');
                                    }
                                }
                            });
                        } else {
                            $scope.Cameras[cameraIndex].isLoading = false;
                            toastr.error("Can't complete this operation");
                        }
                    });
                };

                $scope.deleteCamera = function (id) {
                    HTTPService.delete('cameras', id, $scope.updatedValues, function (response) {
                        if (response.status === 200) {
                            $scope.load($scope.currentPage);
                            toastr.success('Camera deleted');
                        } else {
                            toastr.error("Can't remove this camera");
                        }
                    });
                };

                $scope.viewCameraDetails = function(id){
                    $location.path('/cameras/' + id);
                };

                $scope.load = function (id) {
                    $scope.loadingList = true;
                    $scope.Cameras = [];
                    $scope.currentPage = id;
                    HTTPService.getAll('cameras', '', $scope.limit, $scope.currentPage, null, {id: 'name', asc: true}, function(response){
                        $scope.loadingList = false;
                        if (response.status === 200) {
                            $scope.pagination = HTTPService.returnPagination(response.data.totalRows, response.data.limit, $scope.currentPage);
                            $scope.Cameras = response.data.resources;
                        }
                    });
                };

                $scope.load(1);
            }
        ]
    );