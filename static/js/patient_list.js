// Global variable to store all patients
let allPatients = [];
let currentSort = { field: 'recent', ascending: false };

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
    window.location.href = '/static/html/login.html';
        return false;
    }
    return true;
}

function updateSort(field) {
    if (currentSort.field === field) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.field = field;
        currentSort.ascending = true;
    }
    applyFilters();
}

function createPatientRow(patient) {
    const initials = patient.name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();

    const formatList = (list) => list && list.length ? list.join(', ') : 'None';
    const formatDate = (date) => {
        if (!date) return 'Not available';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return `
        <tr class="table-row" data-patient='${JSON.stringify(patient)}'>
            <td>
                <div class="patient-info-cell">
                    <div class="avatar">${initials}</div>
                    <div>
                        <div class="patient-name">${patient.name}</div>
                        <div class="patient-details">${patient.age} years • ${patient.gender} • ${patient.bloodType}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge status-${patient.status}">
                    ${patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                </span>
            </td>
            <td>${formatDate(patient.lastVisit)}</td>
            <td>
                <div class="contact-info">
                    <span><i></i> Medications: ${formatList(patient.medications)}</span>
                    <span><i>⚠️</i> Allergies: ${formatList(patient.allergies)}</span>
                </div>
            </td>
            <td>
                <div class="contact-info">
                    <span><i>📄</i> ${patient.reports ? (Array.isArray(patient.reports) ? patient.reports.join(', ') : patient.reports) : 'None'}</span>
                </div>
            </td>
        </tr>
    `;
}

function displayFilteredPatients(patients) {
    const tableBody = document.getElementById('patientTableBody');
    const table = document.getElementById('patientTable');
    const emptyState = document.getElementById('emptyState');

    if (patients.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        tableBody.innerHTML = patients.map(patient => 
            createPatientRow(patient)
        ).join('');
        table.style.display = 'table';
        emptyState.style.display = 'none';
    }
}

async function loadPatients() {
    if (!checkAuth()) return;

    const table = document.getElementById('patientTable');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');
    
    loadingSpinner.style.display = 'flex';
    table.style.display = 'none';
    emptyState.style.display = 'none';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/patients', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch patients');
        }

        const result = await response.json();
        allPatients = result.data;

        if (allPatients && allPatients.length > 0) {
            displayFilteredPatients(allPatients);
        } else {
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading patients:', error);
        if (error.message.includes('Failed to fetch')) {
            alert('Session expired. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = '/static/html/login.html';
        } else {
            emptyState.style.display = 'block';
        }
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function filterPatients(searchText) {
    if (!allPatients) return;

    const status = document.getElementById('statusFilter').value;
    let filteredPatients = [...allPatients];
    
    // Apply text search
    if (searchText) {
        const searchLower = searchText.toLowerCase();
        filteredPatients = filteredPatients.filter(patient =>
            patient.name.toLowerCase().includes(searchLower) ||
            patient.email.toLowerCase().includes(searchLower) ||
            patient.phone.includes(searchText) ||
            (patient.address && patient.address.toLowerCase().includes(searchLower)) ||
            (patient.city && patient.city.toLowerCase().includes(searchLower))
        );
    }
    
    // Apply status filter
    if (status !== 'all') {
        filteredPatients = filteredPatients.filter(patient => 
            patient.status === status
        );
    }

    // Apply sort
    const sortBy = document.getElementById('sortBy').value;
    applySort(filteredPatients, sortBy);

    // Display filtered results
    displayFilteredPatients(filteredPatients);
}

function applySort(patients, sortBy) {
    const sortField = currentSort.field || sortBy;
    const ascending = currentSort.ascending;

    patients.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'recent':
                comparison = new Date(b.lastVisit) - new Date(a.lastVisit);
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
            case 'age':
                comparison = b.age - a.age;
                break;
        }
        return ascending ? comparison : -comparison;
    });
}

function applyFilters() {
    const searchText = document.getElementById('searchInput').value;
    filterPatients(searchText);
}

function formatDate(date) {
    if (!date) return 'Not available';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showPatientModal(patient) {
    // Optionally, add logic for the follow up button
    const followUpBtn = document.getElementById('followUpBtn');
    if (followUpBtn) {
        followUpBtn.onclick = function() {
            // Set today's date in the follow up modal
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('followUpDate').value = today;
            document.getElementById('followUpTests').value = '';
            document.getElementById('followUpReports').value = '';
            document.getElementById('followUpPrescription').value = '';
            // Show follow up modal over details modal
            document.getElementById('followUpModal').style.display = 'block';
            document.getElementById('followUpModal').focus();
        };
    }

    // Handle follow up form submission
    const followUpForm = document.getElementById('followUpForm');
    if (followUpForm) {
        followUpForm.onsubmit = function(e) {
            e.preventDefault();
            // You can add logic here to save the follow up data
            document.getElementById('followUpModal').style.display = 'none';
            // Keep details modal open
            alert('Follow up saved!');
        };
    }

    // Set reports for all fields if available
    document.getElementById('modalMedicationsReports').textContent = patient.medicationsReports || 'None';
    document.getElementById('modalAllergiesReports').textContent = patient.allergiesReports || 'None';
    document.getElementById('modalMedicalHistoryReports').textContent = patient.medicalHistoryReports || 'None';
    document.getElementById('modalSurgicalHistoryReports').textContent = patient.surgicalHistoryReports || 'None';
    document.getElementById('modalHeightReports').textContent = patient.heightReports || 'None';
    document.getElementById('modalWeightReports').textContent = patient.weightReports || 'None';
    document.getElementById('modalFamilyDoctorReports').textContent = patient.familyDoctorReports || 'None';
    document.getElementById('modalPreferredPharmacyReports').textContent = patient.preferredPharmacyReports || 'None';
    document.getElementById('modalSmokingStatusReports').textContent = patient.smokingStatusReports || 'None';
    document.getElementById('modalAlcoholConsumptionReports').textContent = patient.alcoholConsumptionReports || 'None';
    document.getElementById('modalExerciseFrequencyReports').textContent = patient.exerciseFrequencyReports || 'None';
    document.getElementById('modalDietaryRestrictionsReports').textContent = patient.dietaryRestrictionsReports || 'None';
    document.getElementById('modalPrescriptionReports').textContent = patient.prescriptionReports || 'None';
    const modal = document.getElementById('patientModal');
    const modalAvatar = document.getElementById('modalAvatar');
    const initials = patient.name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();

    modalAvatar.textContent = initials;
    document.getElementById('modalPatientName').textContent = patient.name;
    document.getElementById('modalPatientBasicInfo').textContent = 
        `${patient.age} years • ${patient.gender} • ${patient.bloodType}`;
    
    document.getElementById('modalAge').textContent = `${patient.age} years`;
    document.getElementById('modalGender').textContent = patient.gender;
    document.getElementById('modalBloodType').textContent = patient.bloodType;
    document.getElementById('modalStatus').innerHTML = 
        `<span class="status-badge status-${patient.status}">
            ${patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
        </span>`;

    document.getElementById('modalPhone').textContent = patient.phone;
    document.getElementById('modalEmail').textContent = patient.email;
    document.getElementById('modalAddress').textContent = 
        `${patient.address}, ${patient.city}, ${patient.state} ${patient.postalCode}`;


    document.getElementById('modalMedications').textContent = patient.medications && patient.medications.length ? patient.medications.join(', ') : 'None';
    document.getElementById('modalAllergies').textContent = patient.allergies && patient.allergies.length ? patient.allergies.join(', ') : 'None';
    document.getElementById('modalMedicalHistory').textContent = patient.medicalHistory && patient.medicalHistory.length ? patient.medicalHistory.join(', ') : 'None';
    document.getElementById('modalSurgicalHistory').textContent = patient.surgicalHistory && patient.surgicalHistory.length ? patient.surgicalHistory.join(', ') : 'None';
    document.getElementById('modalHeight').textContent = patient.height ? patient.height + ' cm' : 'Not available';
    document.getElementById('modalWeight').textContent = patient.weight ? patient.weight + ' kg' : 'Not available';
    document.getElementById('modalFamilyDoctor').textContent = patient.familyDoctor || 'Not available';
    document.getElementById('modalPreferredPharmacy').textContent = patient.preferredPharmacy || 'Not available';
    document.getElementById('modalSmokingStatus').textContent = patient.smokingStatus || 'Not available';
    document.getElementById('modalAlcoholConsumption').textContent = patient.alcoholConsumption || 'Not available';
    document.getElementById('modalExerciseFrequency').textContent = patient.exerciseFrequency || 'Not available';
    document.getElementById('modalDietaryRestrictions').textContent = patient.dietaryRestrictions && patient.dietaryRestrictions.length ? patient.dietaryRestrictions.join(', ') : 'None';
    document.getElementById('modalPrescription').textContent = patient.prescription || 'Not available';
    // Show follow-ups as a list view
    let followUpTableHtml = '';
    if (patient.reports) {
        let followUps = [];
        if (Array.isArray(patient.reports)) {
            followUps = patient.reports;
        } else {
            try {
                followUps = JSON.parse(patient.reports);
                if (!Array.isArray(followUps)) followUps = [patient.reports];
            } catch (e) {
                followUps = [patient.reports];
            }
        }
        followUpTableHtml += '<div style="overflow-x:auto; max-width:100%;"><table style="font-size:0.98rem; min-width:650px; width:100%; border-collapse:separate; border-spacing:0; margin-top:0.5em;">';
        followUpTableHtml += '<thead><tr style="background:#f2f6fa;">' +
            '<th style="padding:7px 12px; border:1px solid #e0e0e0; min-width:100px; white-space:nowrap; font-weight:600;">Date</th>' +
            '<th style="padding:7px 12px; border:1px solid #e0e0e0; min-width:140px; font-weight:600; word-break:break-word;">Tests Recommended</th>' +
            '<th style="padding:7px 12px; border:1px solid #e0e0e0; min-width:140px; font-weight:600; word-break:break-word;">Reports</th>' +
            '<th style="padding:7px 12px; border:1px solid #e0e0e0; min-width:140px; font-weight:600; word-break:break-word;">Prescription</th>' +
            '</tr></thead><tbody>';
        followUps.forEach(function(fu, idx) {
            // Accept both string and object for backward compatibility
            let date = '', tests = '', reports = '', prescription = '';
            if (typeof fu === 'object' && fu !== null) {
                date = fu.date || '';
                tests = fu.tests || '';
                reports = fu.reports || '';
                prescription = fu.prescription || '';
            } else if (typeof fu === 'string') {
                reports = fu;
            }
            followUpTableHtml += `<tr><td style="padding:6px 8px; border:1px solid #e0e0e0; font-size:0.97rem;">${date}</td><td style="padding:6px 8px; border:1px solid #e0e0e0; font-size:0.97rem; word-break:break-word;">${tests}</td><td style="padding:6px 8px; border:1px solid #e0e0e0; font-size:0.97rem; word-break:break-word;">${reports}</td><td style="padding:6px 8px; border:1px solid #e0e0e0; font-size:0.97rem; word-break:break-word;">${prescription}</td></tr>`;
        });
    followUpTableHtml += '</tbody></table></div>';
    } else {
        followUpTableHtml = '<span style="color:#888;">No follow up yet</span>';
    }
    document.getElementById('modalReports').innerHTML = followUpTableHtml;
    document.getElementById('modalLastVisit').textContent = formatDate(patient.lastVisit);
    document.getElementById('modalNotes').textContent = patient.notes || 'No notes available';

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hidePatientModal() {
    const modal = document.getElementById('patientModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

window.onclick = function(event) {
    const modal = document.getElementById('patientModal');
    if (event.target == modal) {
        hidePatientModal();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPatients();
    document.getElementById('patientTableBody').addEventListener('click', (e) => {
        const row = e.target.closest('.table-row');
        if (row) {
            const patientData = JSON.parse(row.dataset.patient);
            showPatientModal(patientData);
        }
    });
    let searchTimeout;
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterPatients(e.target.value);
        }, 300);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hidePatientModal();
        }
    });

    // Modal logic for Add New Patient
    const openNewPatientModalBtn = document.getElementById('openNewPatientModal');
    if (openNewPatientModalBtn) {
        openNewPatientModalBtn.onclick = async function() {
            try {
                const response = await fetch('/static/html/new_patient.html');
                const content = await response.text();
                document.getElementById('newPatientModalContent').innerHTML = content;
                document.getElementById('newPatientModal').style.display = 'block';

                // Re-evaluate scripts in the loaded content so closeModal is available
                var scripts = document.getElementById('newPatientModalContent').getElementsByTagName('script');
                for (var i = 0; i < scripts.length; i++) {
                    var newScript = document.createElement('script');
                    if (scripts[i].src) {
                        newScript.src = scripts[i].src;
                    } else {
                        newScript.text = scripts[i].text;
                    }
                    document.body.appendChild(newScript);
                }

                // Add click outside to close
                document.getElementById('newPatientModal').onclick = function(e) {
                    if (e.target === this) {
                        this.style.display = 'none';
                    }
                };
            } catch (e) {
                alert('Could not load new patient form.');
            }
        };
    }
});
