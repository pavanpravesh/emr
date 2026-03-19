function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
    window.location.href = '/static/html/login.html';
        return;
    }
    try {
        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const data = await response.json();
            const greeting = getGreeting();
            document.getElementById('message').innerHTML = 
                `${greeting}, <span style=\"color: #1a2a6c; font-weight: bold;\">${data.user}</span>! 👋<br>
                <span style=\"font-size: 1rem; color: #666; display: block; margin-top: 0.5rem;\">
                    Welcome to your Patient Management Dashboard
                </span>`;
        } else {
            localStorage.removeItem('token');
            window.location.href = '/static/html/login.html';
        }
    } catch (error) {
        console.error('Error:', error);
        localStorage.removeItem('token');
    window.location.href = '/static/html/login.html';
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/static/html/login.html';
}

async function handleNew() {
    try {
    const response = await fetch('/static/html/new_patient.html');
        const content = await response.text();
        document.getElementById('modalContent').innerHTML = content;
        const modal = document.getElementById('patientModal');
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading modal content:', error);
        alert('Error loading the form. Please try again.');
    }
}

function closeModal() {
    const modal = document.getElementById('patientModal');
    modal.style.display = 'none';
    document.getElementById('modalContent').innerHTML = '';
}

async function submitPatientForm(event) {
    event.preventDefault();
    const formData = {
        name: document.getElementById('name').value,
        address: document.getElementById('address').value,
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value
    };
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/patients', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        if (response.ok) {
            alert('Patient added successfully!');
            closeModal();
            if (document.getElementById('content-area').querySelector('.patient-list')) {
                handlePatients();
            }
        } else {
            const error = await response.json();
            alert('Error adding patient: ' + (error.detail || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error adding patient. Please try again.');
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('patientModal');
    if (event.target === modal) {
        closeModal();
    }
};

function handlePatients() {
    window.location.href = '/static/html/patient_list.html';
}

function handleReports() {
    window.location.href = '/static/html/reports.html';
}

checkAuth();
