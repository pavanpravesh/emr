function setLoading(isLoading) {
    const button = document.querySelector('.login-button');
    if (isLoading) {
        button.textContent = 'Signing in...';
        button.style.opacity = '0.8';
        button.disabled = true;
    } else {
        button.textContent = 'Sign In';
        button.style.opacity = '1';
        button.disabled = false;
    }
}

window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
    window.location.href = '/static/html/home.html';
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';
    setLoading(true);
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            await new Promise(resolve => setTimeout(resolve, 500));
            window.location.href = '/static/html/home.html';
        } else {
            errorMessage.style.display = 'block';
            errorMessage.textContent = data.detail || 'Invalid username or password';
            setLoading(false);
        }
    } catch (error) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'An error occurred. Please try again later.';
        setLoading(false);
    }
});

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
        document.getElementById('errorMessage').style.display = 'none';
    });
});
