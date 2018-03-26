/**
 * Created by dbroqua on 8/17/16.
 */

angular.module('HomePage')
    .controller('HomePageController',
        ['$rootScope',
            function ($rootScope) {
                'use strict';
                $rootScope.title = TITLEPrefix + 'Homepage';
            }]);