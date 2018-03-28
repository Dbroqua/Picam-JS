/**
 * Created by dbroqua on 8/17/16.
 */

angular.module('HomePage')
    .controller('HomePageController', ['$rootScope', '$scope', 'HTTPService',
        function($rootScope, $scope, HTTPService) {
            'use strict';
            $rootScope.title = TITLEPrefix + 'Homepage';
            $scope.loadingList = true;
            $scope.Monitoring = {};

            HTTPService.getAll('sys', '', null, null, null, null, function(response) {
                $scope.loadingList = false;
                if (response.status === 200) {
                    console.log(response.data);

                    $scope.Monitoring = response.data;
                }
            });
        }
    ]);