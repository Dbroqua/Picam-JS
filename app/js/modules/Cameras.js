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
                    HTTPService.patch('cameras', id, values, function (response) {
                        if (response.status === 200) {
                            toastr.success('Action completed');
                            $scope.load($scope.currentPage);
                        } else {
                            toastr.error("Can't complete this operation");
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
                    HTTPService.getAll('cameras', $scope.limit, $scope.currentPage, null, {id: 'name', asc: true}, function(response){
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