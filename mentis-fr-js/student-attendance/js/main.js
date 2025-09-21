// Navbar functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function scrollToLoginCard() {
    try {
        const loginCard = document.getElementById('login');
        if (!loginCard) {
            console.error('Login card not found');
            return;
        }

        // Get the position of the login card
        const cardRect = loginCard.getBoundingClientRect();
        const navbarHeight = 80;
        const extraOffset = 20;

        // Calculate scroll position
        const scrollPosition = window.scrollY + cardRect.top - navbarHeight - extraOffset;

        // Scroll to the position
        window.scrollTo({
            top: Math.max(0, scrollPosition),
            behavior: 'smooth'
        });

        console.log('Scrolled to login card successfully');
    } catch (error) {
        console.error('Error scrolling to login card:', error);
    }
}


function handleNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = (window.localStorage.getItem('API_BASE') || 'http://localhost:9000').replace(/\/$/, '');

    async function apiRequest(path, { method = 'GET', body, headers = {}, auth = false } = {}) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json', ...headers },
            // only send credentials (cookies) when explicitly needed
        };
        if (body) opts.body = JSON.stringify(body);
        if (auth) {
            const token = localStorage.getItem('access_token');
            if (token) opts.headers['Authorization'] = `Bearer ${token}`;
            opts.credentials = 'include';
        }
        const res = await fetch(`${API_BASE}${path}`, opts);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Request failed');
        return data;
    }

    function saveAuth({ accessToken, refreshToken, user }) {
        if (accessToken) localStorage.setItem('access_token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        if (user) localStorage.setItem('user', JSON.stringify(user));
    }

    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoContainer = document.querySelector('.logo-container');

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        loginTab.classList.remove('inactive');
        signupTab.classList.add('inactive');
        signupTab.classList.remove('active');

        loginForm.style.display = 'flex';
        signupForm.style.display = 'none';
        if (window.innerWidth <= 640) {
            logoContainer.style.display = 'flex';
        }
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        signupTab.classList.remove('inactive');
        loginTab.classList.add('inactive');
        loginTab.classList.remove('active');

        signupForm.style.display = 'flex';
        loginForm.style.display = 'none';
        if (window.innerWidth <= 640) {
            logoContainer.style.display = 'none';
        }
    });

    const togglePassword = document.querySelectorAll('.toggle-password');

    togglePassword.forEach(button => {
        button.addEventListener('click', () => {
            const passwordInput = button.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                        <path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.561 1.561 0 000-1.342A10.029 10.029 0 0010 3c-2.25 0-4.31.89-5.88 2.34L3.28 2.22zM7.58 7.58a3 3 0 004.132 4.132l-4.132-4.132z" clip-rule="evenodd" />
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                    </svg>
                `;
            } else {
                passwordInput.type = 'password';
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                    </svg>
                `;
            }
        });
    });

    const forms = [loginForm, signupForm];

    forms.forEach(form => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            let isValid = true;
            const inputs = form.querySelectorAll('input[required]');

            inputs.forEach(input => {
                const errorElement = document.getElementById(`${input.id}-error`);
                if (!input.value.trim()) {
                    isValid = false;
                    if (errorElement) {
                        errorElement.textContent = 'This field is required.';
                        errorElement.style.display = 'block';
                    }
                    input.classList.add('error');
                } else {
                    if (errorElement) {
                        errorElement.textContent = '';
                        errorElement.style.display = 'none';
                    }
                    input.classList.remove('error');
                }
            });

            if (!isValid) return;

            try {
                if (form.id === 'login-form') {
                    const email = document.getElementById('login-email').value.trim();
                    const password = document.getElementById('login-password').value.trim();
                    const role = document.getElementById('login-role').value;
                    console.log('🔄 Attempting login:', { email, role });
                    const resp = await apiRequest('/api/v1/users/login', { method: 'POST', body: { email, password, role } });
                    console.log('📊 Login response:', resp);
                    const { data } = resp || {};
                    const accessToken = data?.accessToken;
                    const refreshToken = data?.refreshToken;
                    const user = data?.user;
                    console.log('👤 User data:', user);
                    saveAuth({ accessToken, refreshToken, user });
                    if (user?.role === 'teacher') {
                        console.log('✅ Redirecting to teacher dashboard');
                        window.location.href = 'teacher.html';
                    } else {
                        console.log('✅ Redirecting to student dashboard');
                        window.location.href = 'student.html';
                    }
                } else if (form.id === 'signup-form') {
                    const name = document.getElementById('fullname').value.trim();
                    const email = document.getElementById('signup-email').value.trim();
                    const password = document.getElementById('signup-password').value.trim();
                    const role = document.getElementById('signup-role').value;
                    console.log('🔄 Attempting signup:', { name, email, role });
                    const resp = await apiRequest('/api/v1/users/register', { method: 'POST', body: { name, email, password, role } });
                    console.log('📊 Signup response:', resp);
                    const { data } = resp || {};
                    const accessToken = data?.accessToken;
                    const refreshToken = data?.refreshToken;
                    const user = data?.user;
                    console.log('👤 User data:', user);
                    saveAuth({ accessToken, refreshToken, user });
                    if (user?.role === 'teacher') {
                        console.log('✅ Redirecting to teacher dashboard');
                        window.location.href = 'teacher.html';
                    } else {
                        console.log('✅ Redirecting to student dashboard');
                        window.location.href = 'student.html';
                    }
                }
            } catch (err) {
                console.error('❌ Form submission error:', err);
                const errorMessage = err.message || 'Request failed';
                alert(`Error: ${errorMessage}`);
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 640) {
            logoContainer.style.display = 'flex';
        } else {
            if (signupTab.classList.contains('active')) {
                logoContainer.style.display = 'none';
            } else {
                logoContainer.style.display = 'flex';
            }
        }
    });


    // Login button click handler
    const loginButton = document.getElementById('login-pill');
    if (loginButton) {
        loginButton.addEventListener('click', function () {
            console.log('Login button clicked');
            scrollToLoginCard();
        });
    } else {
        console.error('Login button not found');
    }

    // Scroll event listeners
    window.addEventListener('scroll', () => {
        handleNavbarScroll();
    });


});
