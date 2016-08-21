/**
 * Created by dbroqua on 8/17/16.
 */

angular.module('Users')
    .controller('UsersController',
        ['$rootScope', '$scope', '$location', 'HTTPService', 'toastr',
            function ($rootScope, $scope, $location, HTTPService, toastr) {
                $rootScope.title = TITLEPrefix + 'Users';
                $scope.Users = [];
                $scope.limit = LIMIT;
                $scope.currentPage = 1;
                $scope.pagination = [];
                $scope.loadingList = false;

                $scope.viewUserDetails = function(id){
                    $location.path('/administration/users/' + id);
                };

                $scope.load = function (id) {
                    $scope.loadingList = true;
                    $scope.Users = [];
                    $scope.currentPage = id;
                    HTTPService.getAll('users', $scope.limit, $scope.currentPage, null, {id: 'name', asc: true}, function(response){
                        $scope.loadingList = false;
                        if (response.status === 200) {
                            $scope.pagination = HTTPService.returnPagination(response.data.totalRows, response.data.limit, $scope.currentPage);
                            $scope.Users = response.data.resources;
                        }
                    });
                };

                $scope.load(1);
            }
        ]
    );