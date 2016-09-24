/**
 * Created by dbroqua on 9/24/16.
 */

angular.module('Cameras')
    .controller('CameraFilesController',
        ['$rootScope', '$scope', '$location', '$routeParams', 'HTTPService',
            function ($rootScope, $scope, $location, $routeParams, HTTPService) {
                $rootScope.title = TITLEPrefix + 'Cameras';
                $scope.cameraId = '';
                $scope.Files = [];
                $scope.limit = LIMIT;
                $scope.currentPage = 1;
                $scope.pagination = [];
                $scope.loadingList = false;

                $scope.load = function (id) {
                    $scope.cameraId = $routeParams.id;
                    $scope.loadingList = true;
                    $scope.Files = [];
                    $scope.currentPage = id;
                    HTTPService.getAll('cameras', '/' + $scope.cameraId + '/files/', $scope.limit, $scope.currentPage, null, null, function (response) {
                        $scope.loadingList = false;
                        if (response.status === 200) {
                            $scope.pagination = HTTPService.returnPagination(response.data.totalRows, response.data.limit, $scope.currentPage);
                            $scope.Files = response.data.resources;
                        }
                    });
                };

                $scope.load(1);
            }
        ]
    );