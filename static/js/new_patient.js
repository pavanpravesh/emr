angular.module('patientApp', [])
.controller('PatientController', function($scope, $http) {
    $scope.formData = {
        medicalHistory: [],
        surgicalHistory: [],
        allergies: [],
        medications: [],
        dietaryRestrictions: []
    };
    $scope.tagInput = {};
    $scope.loading = false;
    $scope.errorMessage = '';

    $scope.addTag = function(event, field) {
        if (event.key === 'Enter' && $scope.tagInput[field] && $scope.tagInput[field].trim()) {
            event.preventDefault();
            if (!$scope.formData[field].includes($scope.tagInput[field].trim())) {
                $scope.formData[field].push($scope.tagInput[field].trim());
            }
            $scope.tagInput[field] = '';
        }
    };

    $scope.removeTag = function(field, index) {
        $scope.formData[field].splice(index, 1);
    };

    $scope.setLoading = function(isLoading) {
        $scope.loading = isLoading;
    };


    $scope.submitPatientForm = function() {
        $scope.setLoading(true);
        $scope.errorMessage = '';
        var data = angular.copy($scope.formData);
        if (data.age) data.age = parseInt(data.age);

        // Check if patient with same name exists
        if (!data.name || !data.name.trim()) {
            $scope.setLoading(false);
            $scope.errorMessage = 'Patient name is required.';
            return;
        }
        $http.get('/api/patients?name=' + encodeURIComponent(data.name.trim()), {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        }).then(function(res) {
            if (res.data && res.data.length > 0) {
                $scope.setLoading(false);
                $scope.errorMessage = 'A patient with this name already exists.';
                return;
            }
            // Handle file uploads for reports
            var formData = new FormData();
            for (var key in data) {
                if (Array.isArray(data[key])) {
                    formData.append(key, JSON.stringify(data[key]));
                } else {
                    formData.append(key, data[key]);
                }
            }
            var reportFilesInput = document.getElementById('reportFiles');
            if (reportFilesInput && reportFilesInput.files.length > 0) {
                for (var i = 0; i < reportFilesInput.files.length; i++) {
                    formData.append('reportFiles', reportFilesInput.files[i]);
                }
            }
            $http.post('/api/patients', formData, {
                headers: {
                    'Content-Type': undefined,
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                transformRequest: angular.identity
            }).then(function(response) {
                $scope.setLoading(false);
                $scope.closeModal();
                if (typeof handlePatients === 'function') {
                    handlePatients();
                }
            }, function(error) {
                $scope.setLoading(false);
                $scope.errorMessage = (error.data && error.data.detail) ? error.data.detail : 'Failed to add patient';
            });
        }, function(error) {
            $scope.setLoading(false);
            $scope.errorMessage = 'Error checking for existing patient.';
        });
    };

    $scope.closeModal = function() {
        if (typeof closeModal === 'function') closeModal();
    };
});
