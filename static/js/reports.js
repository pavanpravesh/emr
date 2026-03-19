// Reports page JavaScript

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/static/html/login.html';
        return false;
    }
    return true;
}

async function loadReports() {
    if (!checkAuth()) return;

    const loadingSpinner = document.getElementById('loadingSpinner');
    const reportsList = document.getElementById('reportsList');

    loadingSpinner.style.display = 'flex';
    reportsList.innerHTML = '';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/reports', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch reports');
        }

        const result = await response.json();
        const reports = result.data;

        if (reports && reports.length > 0) {
            // Sort reports by date descending
            reports.sort((a, b) => new Date(b.date) - new Date(a.date));

            reports.forEach(report => {
                const reportElement = createReportElement(report);
                reportsList.appendChild(reportElement);
            });
        } else {
            reportsList.innerHTML = '<p>No reports available.</p>';
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        if (error.message.includes('Failed to fetch')) {
            alert('Session expired. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = '/static/html/login.html';
        } else {
            reportsList.innerHTML = '<p>Error loading reports.</p>';
        }
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function createReportElement(report) {
    const reportDiv = document.createElement('div');
    reportDiv.className = 'report-item';

    const formatDate = (date) => {
        if (!date) return 'Not available';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    reportDiv.innerHTML = `
        <div class="report-header">
            <div class="report-title">${report.name} - ${report.tests || 'Report'}</div>
            <div class="report-date">${formatDate(report.date)}</div>
        </div>
        <div class="report-details">
            <p><strong>DOB:</strong> ${formatDate(report.dob)} | <strong>Age:</strong> ${report.age}</p>
            <p><strong>Reports:</strong> ${report.reports || 'None'}</p>
            <p><strong>Prescription:</strong> ${report.prescription || 'None'}</p>
        </div>
    `;

    return reportDiv;
}

document.addEventListener('DOMContentLoaded', () => {
    loadReports();
});