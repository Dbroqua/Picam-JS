/**
 * Created by dbroqua on 8/17/16.
 */

angular.module('HomePage')
    .controller('HomePageController', ['$rootScope', '$scope', '$interval', 'HTTPService',
        function($rootScope, $scope, $interval, HTTPService) {
            'use strict';
            $rootScope.title = TITLEPrefix + 'Homepage';
            $scope.isLoading = true;
            $scope.Monitoring = {};
            $scope.lastRefresh = null;

            $scope.monitoring = function() {
                $scope.isLoading = true;
                $scope.lastRefresh = null;
                HTTPService.getAll('sys', '', null, null, null, null, function(response) {
                    $scope.loadingList = false;
                    if (response.status === 200) {
                        $scope.isLoading = false;
                        $scope.Monitoring = response.data;

                        $scope.Monitoring.memory.usage = Math.round($scope.Monitoring.memory.used * 100 / $scope.Monitoring.memory.total);
                        $scope.Monitoring.disks.root.usage = Math.round(100 - $scope.Monitoring.disks.root.free * 100 / $scope.Monitoring.disks.root.total);
                        $scope.Monitoring.disks.boot.usage = Math.round(100 - $scope.Monitoring.disks.boot.free * 100 / $scope.Monitoring.disks.boot.total);

                        $scope.lastRefresh = moment().format("DD/MM/YYYY H:m:s");
                    }
                });
            };

            $scope.monitoring();
        }
    ])
    .directive('sysProgressBar', function() {
        return {
            restrict: 'E',
            scope: {
                value: '=value',
                title: '@'
            },
            templateUrl: 'templates/progress-bar.html'
        };
    });