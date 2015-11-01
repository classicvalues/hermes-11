(function() {
    'use strict';

    function QuestCreationCtrl(hermesService, $q, $routeParams, $location) {
        var vm = this;

        vm.user = null;
        vm.hostList = [];
        vm.selectedFate = null;
        vm.description = null;
        vm.today = new Date();
        vm.targetDate = new Date();
        vm.targetDate.setDate(new Date().getDate() + 14);
        vm.targetDate.setTime(Math.round(vm.targetDate.getTime() / 900000) * 900000);

        vm.errorMessages = null;
        vm.queryErrorMessage = null;
        vm.successMessage = null;
        vm.createInProgress = false;
        vm.queryInProgress = false;
        vm.result = null;
        vm.showFatesModal = false;
        vm.queryString = null;
        vm.hostNameEntry = null;

        vm.queriedHosts = [];
        vm.startingEventTypes = null;
        vm.startingFates = [];

        vm.selectOptions = {
            updateOn: 'default change blur',
            getterSetter: true,
            allowInvalid: true
        };


        hermesService.getFates().then(function(fates) {
            vm.startingFates = [];
            for (var idx in fates) {
                if (!fates[idx]['followsId']) {
                    vm.startingFates.push(fates[idx]);
                }
            }
            if (vm.startingFates.length != 0) {
                vm.selectedFate = vm.startingFates[0];
            }
        });

        hermesService.getCurrentUser().then(function(user){
            if (user) {
                vm.user = user;
            } else {
                vm.errorMessages.push("Cannot create a new quest if not authenticated.");
            }
        });

        vm.runQuery = runQuery;
        vm.removeQueriedHost = removeQueriedHost;
        vm.removeHost = removeHost;
        vm.addHost = addHost;
        vm.moveQueriedToQueued = moveQueriedToQueued;
        vm.fateSelection = fateSelection;
        vm.createQuest = createQuest;
        vm.calDateClasser = calDateClasser;


        ////////////////////////////////

        /**
         * Create a quest with the information we have
         */
        function createQuest() {
            if (vm.createInProgress) return;

            vm.createInProgress = true;

            vm.errorMessages = [];

            if (vm.hostList.length == 0) {
                vm.errorMessages.push("Cannot create a quest with an empty list of hosts.");
            }

            if (!vm.selectedFate) {
                vm.errorMessages.push("Cannot create a quest without a starting fate.");
            }

            if (!vm.description) {
                vm.errorMessages.push("Cannot create a quest without a description.");
            }

            if (!vm.user) {
                vm.errorMessages.push("Cannot create a new quest if not authenticated.");
            }

            if (vm.errorMessages.length != 0) {
                vm.createInProgress = false;
                return;
            }

            vm.result = hermesService.createQuest(vm.user, vm.hostList,
                vm.selectedFate.creationEventType, vm.targetDate, vm.description)
                .then(function(response) {
                    vm.createInProgress = false;
                    vm.hostList = [];
                    vm.description = null;
                    vm.successMessage = "Successfully create quest " + response.data.id;
                })
                .catch(function(error) {
                    vm.createInProgress = false;
                    vm.errorMessages.push("Quest creation failed!  " + error.statusText);
                });

        }

        /**
         * The getter/setter for event types
         */
        function fateSelection(selection) {
            if (angular.isDefined(selection)) {
                vm.selectedFate = selection;
            } else {
                return vm.selectedFate;
            }

        }

        /**
         * Run the user specified query against the query passthrough service
         */
        function runQuery() {
            if (!vm.queryString || vm.queryString.trim().length == 0) {
                vm.queryErrorMessage = "Query is empty.";
                return;
            }
            vm.queryErrorMessage = null;
            vm.queryInProgress = true;
            hermesService.runQuery(vm.queryString).then(function(hosts) {
                vm.queryInProgress = false;
                if (hosts && hosts.length != 0) {
                    console.log(hosts);
                    vm.queriedHosts = hosts;
                } else {
                    console.log("EMPTY!");
                    vm.queryErrorMessage = "Query returned no results.";
                }
            }).catch(function(error) {
                console.log("ERROR!");
                vm.queryInProgress = false;
                vm.queryErrorMessage = "Failed to run query!  " + error.statusText;
            });
        }

        /**
         * Remove a host from the list of hosts generated by the query
         * @param host the host to remove
         */
        function removeQueriedHost(host) {
            var idx = vm.queriedHosts.indexOf(host);
            if (idx > -1) {
                vm.queriedHosts.splice(idx, 1);
            }
        }

        /**
         * Remove a host from the list of hosts queued up for this quest
         * @param host the host to remove
         */
        function removeHost(host) {
            var idx = vm.hostList.indexOf(host);
            if (idx > -1) {
                vm.hostList.splice(idx, 1);
            }
        }

        /**
         * Add a specified host to the hosts queued up, but only if it isn't
         * in there already
         * @param host the host to add
         */
        function addHost(host) {
            if (!host) return;
            if (vm.hostList.indexOf(host) == -1) {
                vm.hostList.push(host);
            }
        }

        /**
         * Add queried hosts to queued hosts
         */
        function moveQueriedToQueued() {
            while (vm.queriedHosts.length > 0) {
                addHost(vm.queriedHosts.shift());
            }
        }

        /**
         * Adds our classes to the date picker
         * @param date the date in question
         * @param mode the mode
         */
        function calDateClasser(date, mode) {
            return "date-picker";
        }

    }

    angular.module('hermesApp').controller('QuestCreationCtrl', QuestCreationCtrl);
    QuestCreationCtrl.$inject = ['HermesService', '$q', '$routeParams', '$location'];
})();
