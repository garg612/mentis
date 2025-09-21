/* ============================================================================
   STUDENT DASHBOARD JAVASCRIPT
   ============================================================================
   
   This file contains all JavaScript functionality for the Student Dashboard:
   - API communication and authentication
   - Navigation and mobile menu handling
   - Profile management and modals
   - Data visualization and charts
   - Form handling and validation
   
   Author: Updated for clean organization
   Last Modified: Current
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function () {
    // ===== API CONFIGURATION =====
    const API_BASE = (window.localStorage.getItem('API_BASE') || 'http://localhost:9000').replace(/\/$/, '');
    const token = localStorage.getItem('access_token');
    if (!token) { try { window.location.href = 'index.html'; } catch (_) { } }
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    async function apiRequest(path, { method = 'GET', body } = {}) {
        const res = await fetch(`${API_BASE}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            credentials: 'include',
            body: body ? JSON.stringify(body) : undefined
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Request failed');
        return data;
    }

    function setText(selector, text) { const el = document.querySelector(selector); if (el) el.textContent = text; }

    // ===== AUTHENTICATION & LOGOUT =====
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch(`${API_BASE}/api/v1/users/logout`, { method: 'POST', headers: { ...authHeaders }, credentials: 'include' });
            } catch (_) { }
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    async function loadProfile() {
        try {
            const resp = await apiRequest('/api/v1/users/me');
            const base = resp?.data?.baseUser;
            const extra = resp?.data?.extraData;
            if (base) {
                setText('.student-name', base.name || '-');
                const fallback = (name) => {
                    const initials = (name || 'User').split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
                    return `https://placehold.co/150x150/2563EB/FFFFFF?text=${encodeURIComponent(initials)}`;
                };
                const mainAvatar = document.getElementById('main-profile-photo');
                const summaryAvatar = document.getElementById('summary-avatar');
                let imgUrl = base.avatar && base.avatar.trim() ? base.avatar : fallback(base.name);

                // Handle avatar URL properly - if it starts with /temp/, prepend API base URL
                if (imgUrl.startsWith('/temp/')) {
                    imgUrl = `${API_BASE}${imgUrl}`;
                }

                if (mainAvatar) mainAvatar.src = imgUrl;
                if (summaryAvatar) summaryAvatar.src = imgUrl.replace('150x150', '60x60');
            }
            if (extra) {
                setText('.university-name', 'Silver Oak University');
                setText('.academic-details', `Semester - ${extra.semester ?? '-'} | ${extra.academicSession ?? '-'}`);
                const pi = extra.personalInfo || {};
                const map = new Map([
                    ['Full Name:', base?.name || extra?.name || '-'],
                    ["Father's Name:", pi?.fatherName || '-'],
                    ["Mother's Name:", pi?.motherName || '-'],
                    ['Date of Birth:', pi?.dateOfBirth || '-'],
                    ['Gender:', pi?.gender || '-'],
                    ['Email:', base?.email || '-'],
                    ['Phone:', pi?.phoneNo || '-'],
                    ['Address:', pi?.address || '-'],
                    ['Roll Number:', extra?.rollNo || '-'],
                    ['Program:', extra?.degree || '-'],
                    ['Department:', extra?.course || '-'],
                    ['Academic Session:', extra?.academicSession || '-'],
                    ['Batch No:', String(extra?.batchNo ?? '-')],
                    ['Current Semester:', String(extra?.semester ?? '-')],
                ]);
                // Only update fields that have data, hide empty ones
                document.querySelectorAll('#profile .detail-row').forEach((rowEl) => {
                    const labelEl = rowEl.querySelector('.detail-label');
                    const valueEl = rowEl.querySelector('.detail-value');
                    if (labelEl && valueEl && map.has(labelEl.textContent.trim())) {
                        const value = map.get(labelEl.textContent.trim());
                        if (value && value !== '-') {
                            valueEl.textContent = value;
                            rowEl.style.display = 'block';
                        } else {
                            rowEl.style.display = 'none';
                        }
                    }
                });
            }
        } catch (e) { /* ignore for demo if not logged in */ }
    }

    async function loadTimetable() {
        try {
            const resp = await apiRequest('/api/v1/users/timetable');
            const classes = resp?.data?.classes || [];
            const list = document.querySelector('#timetable .timetable-list');
            if (list && classes.length) {
                list.innerHTML = '';
                classes.forEach(c => {
                    if ((c.subject || '').toLowerCase() === 'lunch break') {
                        const li = document.createElement('li');
                        li.className = 'timetable-separator';
                        // Clean up endTime to remove "(Lunch)" if present
                        const cleanEndTime = c.endTime.replace(/\s*\(Lunch\)\s*/gi, '');
                        li.innerHTML = `
                            <div class="separator-title">Lunch Break</div>
                            <div class="separator-time">${c.startTime} - ${cleanEndTime}</div>`;
                        list.appendChild(li);
                        return;
                    }
                    const li = document.createElement('li');
                    li.className = 'timetable-item';
                    li.setAttribute('data-subject', c.subject);
                    li.setAttribute('data-code', c.subject);
                    li.setAttribute('data-batch', resp?.data?.batch);
                    li.setAttribute('data-time', `${c.startTime} - ${c.endTime}`);
                    li.innerHTML = `
                        <div class="timetable-info">
                            <h3>${c.subject}</h3>
                            <p><strong>Code:</strong> ${c.subjectCode || c.subject} | <strong>Faculty:</strong> ${c.teacherName || '-'}</p>
                            <p><strong>Classroom:</strong> ${c.room || '-'} | <strong>Time:</strong> ${c.startTime} - ${c.endTime}</p>
                        </div>
                        <div class="timetable-action">
                            <span class="att-status" style="margin-left:8px; font-weight:700; color:#16a34a; display:none;">Attendance recorded</span>
                        </div>`;
                    list.appendChild(li);
                });
            }
        } catch (e) { /* ignore */ }
    }

    async function hydrateAttendanceSection() {
        try {
            const statsResp = await apiRequest('/api/v1/attendance/myattendance');
            const subjects = statsResp?.data?.subjects || {};
            const labels = Object.keys(subjects);
            const percentages = labels.map(k => subjects[k]?.percentage ?? 0);
            if (typeof Chart !== 'undefined') {
                if (subjectChart) {
                    subjectChart.data.labels = labels.length ? labels : subjectChart.data.labels;
                    subjectChart.data.datasets[0].data = labels.length ? percentages : subjectChart.data.datasets[0].data;
                    subjectChart.update();
                }
                const overall = statsResp?.data?.overall;
                if (overallChart && overall) {
                    overallChart.data.datasets[0].data = [overall.totalPresent, overall.totalAbsent];
                    overallChart.update();
                }
            }
            // Update summary widgets
            const overall = statsResp?.data?.overall;
            const pctEl = document.getElementById('overall-percentage');
            const presEl = document.getElementById('overall-present');
            const statusEl = document.getElementById('overall-status');
            if (overall && pctEl && presEl && statusEl) {
                pctEl.textContent = `${overall.percentage ?? 0}%`;
                presEl.textContent = `${overall.totalPresent ?? 0}/${overall.totalClasses ?? 0}`;
                const pct = overall.percentage ?? 0;
                statusEl.textContent = (overall.totalClasses ?? 0) === 0 ? 'No data' : (pct >= 80 ? 'Good' : 'Below 80%');
            } else {
                if (pctEl) pctEl.textContent = '0%';
                if (presEl) presEl.textContent = '0/0';
                if (statusEl) statusEl.textContent = 'No data';
            }
        } catch (_) { }
    }

    // ===== NAVIGATION SYSTEM =====
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    const menuToggle = document.getElementById('menu-toggle');
    const navbar = document.getElementById('navbar');

    // Tab switching for navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Set clicked link active
            link.classList.add('active');

            // Show target section
            const targetSection = document.getElementById(link.dataset.target);
            if (targetSection) targetSection.classList.add('active');

            // Close mobile menu if open
            if (navbar && navbar.classList.contains('mobile-open')) {
                navbar.classList.remove('mobile-open');
            }
        });
    });

    // Mobile menu toggle with improved error handling
    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            navbar.classList.toggle('mobile-open');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (navbar.classList.contains('mobile-open')) {
                if (!navbar.contains(e.target) && !menuToggle.contains(e.target)) {
                    navbar.classList.remove('mobile-open');
                }
            }
        });

        // Close menu with escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navbar.classList.contains('mobile-open')) {
                navbar.classList.remove('mobile-open');
            }
        });

        // Close menu when clicking close button (pseudo-element)
        navbar.addEventListener('click', function (e) {
            if (e.target === navbar && navbar.classList.contains('mobile-open')) {
                navbar.classList.remove('mobile-open');
            }
        });
    }

    // ===== PROFILE MANAGEMENT =====
    const passwordModal = document.getElementById('password-modal'); // Modal element
    const changePasswordBtn = document.getElementById('change-password-btn'); // Button to open modal
    const closeModalBtn = document.getElementById('close-modal-btn'); // Button to close modal
    const passwordForm = document.getElementById('password-change-form'); // Password form
    // Upload avatar button (second action button)
    const uploadAvatarBtn = document.querySelector('.profile-actions a:nth-child(2)');
    if (uploadAvatarBtn) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);
        uploadAvatarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            input.click();
        });
        input.addEventListener('change', async () => {
            if (!input.files || !input.files[0]) return;
            const formData = new FormData();
            formData.append('avatar', input.files[0]);
            try {
                const res = await fetch(`${API_BASE}/api/v1/users/addavatar`, {
                    method: 'POST',
                    headers: { ...authHeaders },
                    credentials: 'include',
                    body: formData
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(json?.message || 'Failed to upload avatar');
                showToast('Avatar updated successfully');

                // Handle avatar URL properly
                const avatar = json?.data?.avatar;
                if (avatar) {
                    const mainAvatar = document.getElementById('main-profile-photo');
                    const summaryAvatar = document.getElementById('summary-avatar');

                    // If avatar starts with /temp/, prepend the API base URL
                    const avatarUrl = avatar.startsWith('/temp/') ? `${API_BASE}${avatar}` : avatar;

                    if (mainAvatar) mainAvatar.src = avatarUrl;
                    if (summaryAvatar) summaryAvatar.src = avatarUrl;
                } else {
                    // Reload profile to get updated avatar
                    loadProfile();
                }
            } catch (err) {
                console.error('Avatar upload error:', err);
                showToast(err.message || 'Failed to upload avatar');
            } finally {
                input.value = '';
            }
        });
    }

    // Open modal on button click
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function () {
            passwordModal.style.display = 'block'; // Show modal
        });
    }
    // Close modal on close button click
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function () {
            passwordModal.style.display = 'none'; // Hide modal
            passwordForm.reset(); // Reset form
        });
    }
    // Close modal if clicking outside modal content
    window.addEventListener('click', function (event) {
        if (event.target == passwordModal) {
            passwordModal.style.display = 'none'; // Hide modal
            passwordForm.reset(); // Reset form
        }
    });

    // Handle password form submission via backend
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (!currentPassword || !newPassword || !confirmPassword) return showToast('All fields are required.');
            if (newPassword !== confirmPassword) return showToast('New passwords do not match.');
            try {
                const res = await fetch(`${API_BASE}/api/v1/users/updatepassword`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders },
                    credentials: 'include',
                    body: JSON.stringify({ oldPassword: currentPassword, newPassword })
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(json?.message || 'Failed to update password');
                showToast('Password updated');
                passwordModal.style.display = 'none';
                passwordForm.reset();
            } catch (err) {
                showToast(err.message || 'Failed to update password');
            }
        });
    }

    // Toast Notification: Shows a message for 3 seconds
    function showToast(message) {
        const toast = document.getElementById('notification-toast'); // Toast element
        toast.textContent = message; // Set message
        toast.className = "show"; // Show toast
        setTimeout(function () {
            toast.className = toast.className.replace("show", ""); // Hide toast after 3s
        }, 3000);
    }

    // Chart.js: Attendance charts (driven by backend when available)
    let subjectChart, overallChart; // Chart instances
    let currentChartType = 'bar'; // Current chart type
    // Attendance data for charts
    const attendanceData = {
        subjects: [],
        percentages: [],
        colors: [
            'rgba(37, 99, 235, 0.8)', // Blue
            'rgba(16, 185, 129, 0.8)', // Green
            'rgba(245, 158, 11, 0.8)', // Orange
            'rgba(139, 92, 246, 0.8)', // Purple
            'rgba(239, 68, 68, 0.8)', // Red
            'rgba(6, 182, 212, 0.8)' // Cyan
        ]
    };
    // Create both charts
    function createCharts() {
        if (window.innerWidth <= 768) {
            const chartsContainer = document.querySelector('.charts-container'); // Chart container
            if (chartsContainer) {
                chartsContainer.style.gridTemplateColumns = '1fr'; // Single column on mobile
                chartsContainer.style.width = '100%';
                chartsContainer.style.maxWidth = '100%';
            }
        }
        createSubjectChart(); // Create bar/line chart
        createOverallChart(); // Create doughnut chart
    }
    // Create subject attendance chart
    function createSubjectChart() {
        const ctx = document.getElementById('subject-attendance-chart').getContext('2d'); // Chart canvas
        if (subjectChart) subjectChart.destroy(); // Destroy old chart
        subjectChart = new Chart(ctx, {
            type: currentChartType, // Chart type
            data: {
                labels: attendanceData.subjects, // X labels
                datasets: [{
                    label: 'Attendance %', // Dataset label
                    data: attendanceData.percentages, // Y data
                    backgroundColor: attendanceData.colors, // Bar/line colors
                    borderColor: attendanceData.colors.map(color => color.replace('0.8', '1')), // Border colors
                    borderWidth: 2, // Border width
                    fill: currentChartType === 'line' ? false : true, // Fill for bar
                    tension: currentChartType === 'line' ? 0.4 : 0 // Line tension
                }]
            },
            options: {
                responsive: true, // Responsive
                maintainAspectRatio: false, // Don't keep aspect
                animation: {
                    duration: 1500, // Animation duration
                    easing: 'easeOutBounce' // Animation style
                },
                scales: {
                    y: {
                        beginAtZero: true, // Start at 0
                        max: 100, // Max 100%
                        ticks: {
                            callback: function (value) { return value + '%'; } // Show %
                        }
                    }
                },
                plugins: {
                    legend: { display: false }, // Hide legend
                    tooltip: {
                        callbacks: {
                            label: function (context) { return context.dataset.label + ': ' + context.parsed.y + '%'; } // Tooltip
                        }
                    }
                }
            }
        });
    }
    // Create overall attendance doughnut chart
    function createOverallChart() {
        const overallCtx = document.getElementById('overall-attendance-chart').getContext('2d'); // Chart canvas
        if (overallChart) overallChart.destroy(); // Destroy old chart
        overallChart = new Chart(overallCtx, {
            type: 'doughnut', // Doughnut chart
            data: {
                labels: ['Present', 'Absent'], // Labels
                datasets: [{
                    data: [0, 0], // Data
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.9)', // Green
                        'rgba(239, 68, 68, 0.9)' // Red
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)', // Green border
                        'rgba(239, 68, 68, 1)' // Red border
                    ],
                    borderWidth: 3, // Border width
                    hoverOffset: 10 // Hover effect
                }]
            },
            options: {
                responsive: true, // Responsive
                maintainAspectRatio: false, // Don't keep aspect
                cutout: '75%', // Doughnut hole size
                animation: {
                    animateScale: true, // Animate scale
                    duration: 1500 // Animation duration
                },
                plugins: {
                    legend: { display: false }, // Hide legend
                    tooltip: {
                        callbacks: {
                            label: function (context) { return context.label + ': ' + context.parsed + '%'; } // Tooltip
                        }
                    }
                }
            },
            plugins: [{
                id: 'doughnutText', // Custom plugin for center text
                beforeDraw: function (chart) {
                    const width = chart.width, height = chart.height, ctx = chart.ctx;
                    ctx.restore();
                    const fontSize = (height / 120).toFixed(2);
                    ctx.font = `bold ${fontSize}em Poppins`;
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#2563EB';
                    const ds = (chart.data && chart.data.datasets && chart.data.datasets[0] && chart.data.datasets[0].data) || [0, 0];
                    const total = (ds[0] || 0) + (ds[1] || 0);
                    const percent = total > 0 ? Math.round(((ds[0] || 0) / total) * 100) : 0;
                    const text = `${percent}%`;
                    const textX = Math.round((width - ctx.measureText(text).width) / 2), textY = height / 2;
                    ctx.fillText(text, textX, textY);
                    ctx.save();
                }
            }]
        });
    }
    // Chart type toggle (bar/line)
    function setupChartControls() {
        const chartButtons = document.querySelectorAll('.chart-toggle-btn'); // Chart toggle buttons
        chartButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                chartButtons.forEach(b => b.classList.remove('active')); // Remove active from all
                btn.classList.add('active'); // Set clicked active
                currentChartType = btn.dataset.chart; // Set chart type
                createSubjectChart(); // Recreate chart
            });
        });
    }







    // Initialize charts and controls when attendance tab is shown
    const attendanceLink = document.querySelector('.nav-link[data-target="attendance"]'); // Attendance tab link
    if (attendanceLink) {
        new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
                    if (!subjectChart) {
                        setTimeout(function () {
                            createCharts(); // Create charts
                            setupChartControls(); // Setup chart toggle
                            hydrateAttendanceSection();
                            if (window.innerWidth <= 768) {
                                setTimeout(function () {
                                    if (subjectChart) subjectChart.resize(); // Resize chart
                                    if (overallChart) overallChart.resize(); // Resize chart
                                }, 200);
                            }
                        }, 100);
                    } else {
                        hydrateAttendanceSection();
                    }
                }
            });
        }).observe(document.getElementById('attendance'), { attributes: true });
    }
    // Responsive chart layout on DOM load
    document.addEventListener('DOMContentLoaded', function () {
        if (window.innerWidth <= 768) {
            const chartsContainer = document.querySelector('.charts-container');
            if (chartsContainer) {
                chartsContainer.style.gridTemplateColumns = '1fr';
                chartsContainer.style.width = '100%';
                chartsContainer.style.maxWidth = '100%';
            }
            const chartCards = document.querySelectorAll('.chart-card');
            chartCards.forEach(function (card) {
                card.style.width = '100%';
                card.style.maxWidth = '100%';
                card.style.padding = '1rem';
            });
        }
    });
    // Resize charts on window resize
    window.addEventListener('resize', function () {
        if (subjectChart) setTimeout(function () { subjectChart.resize(); }, 100);
        if (overallChart) setTimeout(function () { overallChart.resize(); }, 100);
    });
    // DataTables: Table functionality (frontend only, optionally hydrate from backend stats)
    $(document).ready(function () {
        const table = $('#absentee-table').DataTable({
            "pageLength": 8, // Records per page
            "lengthMenu": [8, 15, 25, 50], // Page length options
            "order": [[1, 'desc']], // Sort by date column
            "columnDefs": [
                { "targets": [0], "width": "40%" }, // Subject column
                { "targets": [1], "width": "30%", "type": "date" }, // Date column
                { "targets": [2], "width": "30%" } // Day column
            ],
            "language": {
                "search": "", // Search label
                "searchPlaceholder": "Search records...", // Search placeholder
                "lengthMenu": "Show _MENU_ records", // Length menu label
                "info": "Showing _START_ to _END_ of _TOTAL_ absent days", // Info label
                "infoEmpty": "No records available", // Empty label
                "paginate": {
                    "first": "First",
                    "last": "Last",
                    "next": "Next",
                    "previous": "Previous"
                }
            },
            "responsive": true, // Responsive table
            "scrollX": true, // Horizontal scroll
            "autoWidth": false, // Disable auto width
            "fixedColumns": false, // No fixed columns
            initComplete: async function () {
                // try to fetch backend stats to populate absentee table
                try {
                    const statsResp = await apiRequest('/api/v1/attendance/myattendance');
                    const absent = statsResp?.data?.absentHistory || [];
                    const overall = statsResp?.data?.overall;
                    const countEl = document.getElementById('absent-count');
                    if (countEl && overall) {
                        const totalAbsent = overall.totalAbsent ?? absent.length;
                        countEl.textContent = `${totalAbsent} absent ${totalAbsent === 1 ? 'day' : 'days'}`;
                    }
                    if (absent.length) {
                        table.clear();
                        absent.forEach(r => {
                            table.row.add([r.subject || '-', (r.date ? new Date(r.date).toISOString().slice(0, 10) : '-'), (r.date ? new Date(r.date).toLocaleDateString(undefined, { weekday: 'long' }) : '-')]);
                        });
                        table.draw();
                    } else {
                        table.clear().draw();
                    }
                } catch (_) { }
                // Subject filter dropdown
                this.api().columns(0).every(function () {
                    var column = this;
                    var select = $('#subject-filter').on('change', function () {
                        var val = $.fn.dataTable.util.escapeRegex($(this).val());
                        column.search(val ? '^' + val + '$' : '', true, false).draw();
                    });
                    column.data().unique().sort().each(function (d, j) {
                        if (select.find('option[value="' + d + '"]').length === 0) {
                            select.append('<option value="' + d + '">' + d + '</option>');
                        }
                    });
                });
                // Date/month filter dropdown
                var dateSelect = $('#date-filter');
                if (dateSelect.length) {
                    dateSelect.on('change', function () {
                        var val = $(this).val();
                        if (val) {
                            table.column(1).search(val, true, false).draw();
                        } else {
                            table.column(1).search('').draw();
                        }
                    });
                }
                // Adjust column widths for alignment
                setTimeout(function () {
                    table.columns.adjust().draw(false);
                    $('#absentee-table').css('width', '100%');
                    var scrollHeadTable = $('#absentee-table_wrapper .dataTables_scrollHeadInner table');
                    if (scrollHeadTable.length) {
                        scrollHeadTable.css('width', '100%');
                        scrollHeadTable.find('th').each(function (index) {
                            var mainTableTh = $('#absentee-table thead th').eq(index);
                            if (mainTableTh.length) {
                                $(this).css('width', mainTableTh.outerWidth() + 'px');
                            }
                        });
                    }
                }, 100);
            }
        });
        // Search input functionality
        $('.dataTables_filter input[type="search"]').off().on('keyup', function () {
            table.search(this.value).draw();
        });
        // Redraw table when attendance section is shown
        const attendanceSection = document.getElementById('attendance');
        if (attendanceSection) {
            new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
                        setTimeout(function () {
                            table.columns.adjust().draw(false);
                            $('#absentee-table').css('width', '100%');
                            var scrollHeadTable = $('#absentee-table_wrapper .dataTables_scrollHeadInner table');
                            if (scrollHeadTable.length) {
                                scrollHeadTable.css('width', '100%');
                                scrollHeadTable.find('th').each(function (index) {
                                    var mainTableTh = $('#absentee-table thead th').eq(index);
                                    if (mainTableTh.length) {
                                        $(this).css('width', mainTableTh.outerWidth() + 'px');
                                    }
                                });
                            }
                        }, 200);
                    }
                });
            }).observe(attendanceSection, { attributes: true });
        }
        // Redraw table on window resize
        $(window).on('resize', function () {
            setTimeout(function () {
                table.columns.adjust().draw(false);
            }, 100);
        });
    });


    // ===== AI MENTOR FUNCTIONALITY =====
    let isEditingProfile = false;
    let lastEditTime = localStorage.getItem('ai_mentor_last_edit');
    const editCooldown = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

    // Quiz and Progress Data
    let quizState = {
        currentQuestion: 0,
        answers: [],
        isQuizActive: false,
        isQuizCompleted: false,
        startTime: null,
        endTime: null
    };

    let progressData = {
        weeklyStats: {
            questionsAttempted: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            totalQuestions: 0,
            startDate: new Date(),
            lastReset: new Date()
        },
        quizHistory: []
    };

    // Quiz Questions with Percentage Distribution
    const quizQuestions = [
        // Career Goals (40% - 4 questions)
        {
            id: 1,
            question: "What is your primary career goal in the next 5 years?",
            options: ["Become a senior developer", "Start my own tech company", "Become a tech lead/manager", "Work in a specific industry"],
            correctAnswer: 0,
            type: "career",
            explanation: "Senior developer is a common and achievable career goal for most students."
        },
        {
            id: 2,
            question: "Which skill is most important for career advancement?",
            options: ["Technical skills only", "Soft skills only", "Both technical and soft skills", "Networking only"],
            correctAnswer: 2,
            type: "career",
            explanation: "Both technical and soft skills are crucial for career advancement."
        },
        {
            id: 3,
            question: "What is the best approach to achieve your career goals?",
            options: ["Work alone", "Collaborate with others", "Avoid challenges", "Focus only on grades"],
            correctAnswer: 1,
            type: "career",
            explanation: "Collaboration and teamwork are essential for career success."
        },
        {
            id: 4,
            question: "How should you approach career planning?",
            options: ["Plan everything in detail", "Be flexible and adaptable", "Follow others' paths", "Avoid planning"],
            correctAnswer: 1,
            type: "career",
            explanation: "Being flexible and adaptable is key in today's dynamic job market."
        },
        // Academic (30% - 3 questions)
        {
            id: 5,
            question: "What is the time complexity of binary search?",
            options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
            correctAnswer: 1,
            type: "academic",
            explanation: "Binary search has O(log n) time complexity as it halves the search space each iteration."
        },
        {
            id: 6,
            question: "Which data structure follows LIFO principle?",
            options: ["Queue", "Stack", "Array", "Linked List"],
            correctAnswer: 1,
            type: "academic",
            explanation: "Stack follows Last In, First Out (LIFO) principle."
        },
        {
            id: 7,
            question: "What does SQL stand for?",
            options: ["Structured Query Language", "Simple Query Language", "Standard Query Language", "System Query Language"],
            correctAnswer: 0,
            type: "academic",
            explanation: "SQL stands for Structured Query Language."
        },
        // Skills (20% - 2 questions)
        {
            id: 8,
            question: "Which is the most important programming skill to develop?",
            options: ["Memorizing syntax", "Problem-solving ability", "Copying code", "Using only one language"],
            correctAnswer: 1,
            type: "skill",
            explanation: "Problem-solving ability is the most important skill for any programmer."
        },
        {
            id: 9,
            question: "What is the best way to improve your coding skills?",
            options: ["Only read books", "Practice regularly", "Avoid challenges", "Work alone always"],
            correctAnswer: 1,
            type: "skill",
            explanation: "Regular practice is the most effective way to improve coding skills."
        },
        // Communication (10% - 1 question)
        {
            id: 10,
            question: "What is the most important aspect of technical communication?",
            options: ["Using complex jargon", "Being clear and concise", "Speaking fast", "Avoiding questions"],
            correctAnswer: 1,
            type: "communication",
            explanation: "Clear and concise communication is essential in technical fields."
        }
    ];

    // Initialize AI Mentor
    function initializeAIMentor() {
        setupFormControls();
        setupChatInterface();
        setupTaskSuggester();
        setupQuizEventListeners();
        setupProgressReportListeners();
        updateEditRestriction();
        loadProfileData();
        loadProgressData();
        checkTaskCompletion();
    }

    // Form Controls
    function setupFormControls() {
        const editBtn = document.getElementById('edit-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        const restrictionInfo = document.getElementById('restriction-info');

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                const savedProfile = localStorage.getItem('ai_mentor_profile');

                if (!savedProfile) {
                    // First time - show alert about restrictions
                    showNotification('Fill things correctly - they cannot be changed if your performance will be low. Choose wisely!', 'warning');
                    enableFormEditing();
                } else if (canEditProfile()) {
                    enableFormEditing();
                } else {
                    showRestrictionMessage();
                }
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                saveProfileData();
            });
        }

        // Form validation for all inputs
        const inputs = document.querySelectorAll('#career-goal, #weak-subject, #skill, #communication-level');
        inputs.forEach(input => {
            input.addEventListener('input', validateForm);
        });
    }

    function canEditProfile() {
        // Check if it's the first time editing
        const savedProfile = localStorage.getItem('ai_mentor_profile');
        if (!savedProfile) return true;

        // All fields now require 75% performance after first save
        return canEditField('all');
    }

    function canEditField(fieldName) {
        // Check if profile has been filled initially
        const savedProfile = localStorage.getItem('ai_mentor_profile');
        if (!savedProfile) return true; // First time setup

        // Get overall percentage from progress report
        const overallPercentage = parseInt(localStorage.getItem('ai_mentor_overall_percentage') || '0');

        // If no progress data available, don't allow editing
        if (overallPercentage === 0) return false;

        // Allow editing if overall performance is above 75%
        return overallPercentage >= 75;
    }

    function updateEditRestriction() {
        const editBtn = document.getElementById('edit-profile-btn');
        const restrictionInfo = document.getElementById('restriction-info');

        if (!canEditProfile()) {
            if (restrictionInfo) {
                restrictionInfo.style.display = 'flex';
                const overallPercentage = parseInt(localStorage.getItem('ai_mentor_overall_percentage') || '0');
                restrictionInfo.querySelector('.restriction-text').textContent =
                    `Achieve 75% overall performance to unlock editing (Current: ${overallPercentage}%)`;
            }

            if (editBtn) {
                editBtn.style.opacity = '0.6';
                editBtn.style.cursor = 'not-allowed';
            }
        } else {
            if (restrictionInfo) {
                restrictionInfo.style.display = 'none';
            }
            if (editBtn) {
                editBtn.style.opacity = '1';
                editBtn.style.cursor = 'pointer';
            }
        }
    }

    function enableFormEditing() {
        isEditingProfile = true;
        const formInputs = document.querySelectorAll('#career-goal, #weak-subject, #skill, #communication-level');
        const editBtn = document.getElementById('edit-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');

        // Enable inputs and show them
        formInputs.forEach(input => {
            const container = input.closest('.input-container');
            if (container) {
                container.classList.add('editing');
                input.disabled = false;
            }
        });

        if (editBtn) editBtn.style.display = 'none';
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.display = 'block';
        }
    }

    function disableFormEditing() {
        isEditingProfile = false;
        const formInputs = document.querySelectorAll('#career-goal, #weak-subject, #skill, #communication-level');
        const editBtn = document.getElementById('edit-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');

        // Hide inputs and show values
        formInputs.forEach(input => {
            const container = input.closest('.input-container');
            if (container) {
                container.classList.remove('editing');
                input.disabled = true;
            }
        });

        if (editBtn) editBtn.style.display = 'block';
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.style.display = 'none';
        }
    }

    function validateForm() {
        const careerGoal = document.getElementById('career-goal').value.trim();
        const weakSubject = document.getElementById('weak-subject').value;
        const skill = document.getElementById('skill').value.trim();
        const communicationLevel = document.getElementById('communication-level').value;
        const saveBtn = document.getElementById('save-profile-btn');

        const isValid = careerGoal && weakSubject && skill && communicationLevel;

        if (saveBtn) {
            saveBtn.disabled = !isValid;
        }
    }

    function saveProfileData() {
        const formData = {
            careerGoal: document.getElementById('career-goal').value.trim(),
            weakSubject: document.getElementById('weak-subject').value,
            skill: document.getElementById('skill').value.trim(),
            communicationLevel: document.getElementById('communication-level').value
        };

        // Update summary display
        updateSummaryDisplay(formData);

        // Save to localStorage
        localStorage.setItem('ai_mentor_profile', JSON.stringify(formData));
        localStorage.setItem('ai_mentor_last_edit', Date.now().toString());

        // Update restriction
        lastEditTime = Date.now().toString();
        updateEditRestriction();

        // Disable editing
        disableFormEditing();

        // Show success message
        showNotification('Profile updated successfully!', 'success');
    }

    function loadProfileData() {
        const savedProfile = localStorage.getItem('ai_mentor_profile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);

            // Populate form
            document.getElementById('career-goal').value = profile.careerGoal || '';
            document.getElementById('weak-subject').value = profile.weakSubject || '';
            document.getElementById('skill').value = profile.skill || '';
            document.getElementById('communication-level').value = profile.communicationLevel || '';

            // Update summary
            updateSummaryDisplay(profile);
        }
    }

    function updateSummaryDisplay(profile) {
        const summaryElements = {
            'summary-career-goal': profile.careerGoal,
            'summary-weak-subject': profile.weakSubject,
            'summary-skill': profile.skill,
            'summary-communication': profile.communicationLevel
        };

        Object.entries(summaryElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'Not set';
            }
        });
    }

    function showRestrictionMessage() {
        const quizResults = JSON.parse(localStorage.getItem('ai_mentor_quiz_results') || '[]');
        const completedQuizzes = quizResults.length;

        if (completedQuizzes === 0) {
            showNotification('Complete quizzes first to unlock profile editing. Achieve 75% performance to edit all fields.', 'warning');
        } else {
            const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0);
            const totalQuestions = quizResults.reduce((sum, result) => sum + result.total, 0);
            const averagePerformance = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;

            showNotification(`Current performance: ${Math.round(averagePerformance)}%. Achieve 75% performance to edit all fields.`, 'warning');
        }
    }

    function checkInitialProfileState() {
        const savedProfile = localStorage.getItem('ai_mentor_profile');
        if (!savedProfile) {
            showNotification('Welcome! Please fill out your profile to get started with personalized AI guidance.', 'info');
        }
    }

    // Chat Interface
    function setupChatInterface() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const chatMessages = document.getElementById('chat-messages');
        const aiAvatar = document.querySelector('.ai-avatar');
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        const historyToggleBtn = document.getElementById('history-toggle-btn');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const chatHistorySidebar = document.getElementById('chat-history-sidebar');
        const currentChatBtn = document.getElementById('current-chat-btn');

        // Initialize chat state
        let isOnline = false;
        let currentChatId = null;
        let chatHistory = JSON.parse(localStorage.getItem('ai_mentor_chat_history') || '[]');
        let todayChatStarted = false; // Track if today's chat has been started

        // Check for daily reset and initialize today's chat
        initializeDailyChat();

        // Load chat history
        loadChatHistory();

        // AI Avatar click to toggle online status
        if (aiAvatar) {
            aiAvatar.addEventListener('click', () => {
                toggleOnlineStatus();
            });
        }

        // Send message functionality - Rewritten for better reliability
        if (sendBtn) {
            sendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Send button clicked, isOnline:', isOnline);
                if (isOnline && chatInput && chatInput.value.trim()) {
                    sendMessage();
                }
            });
        }

        // Input field functionality - Rewritten for better reliability
        if (chatInput) {
            // Enable input when online
            chatInput.addEventListener('input', () => {
                console.log('Input changed:', chatInput.value);
            });

            // Handle Enter key
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('Enter pressed, isOnline:', isOnline);
                    if (isOnline && chatInput.value.trim()) {
                        sendMessage();
                    }
                }
            });

            // Handle focus
            chatInput.addEventListener('focus', () => {
                console.log('Input focused, isOnline:', isOnline);
            });
        }

        // History toggle functionality
        if (historyToggleBtn) {
            historyToggleBtn.addEventListener('click', toggleHistorySidebar);
        }

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', toggleHistorySidebar);
        }

        // Current chat button functionality
        if (currentChatBtn) {
            currentChatBtn.addEventListener('click', () => {
                loadCurrentChat();
            });
        }

        // Initialize chat interface
        initializeChatInterface();

        function initializeChatInterface() {
            console.log('Initializing chat interface...');

            // Ensure input and button are properly disabled initially
            if (chatInput) {
                chatInput.disabled = true;
                chatInput.placeholder = 'Click on AI Mentor to start chatting...';
                console.log('Input initialized as disabled');
            }

            if (sendBtn) {
                sendBtn.disabled = true;
                console.log('Send button initialized as disabled');
            }

            // Ensure status is offline initially
            if (statusIndicator) {
                statusIndicator.classList.remove('online');
                statusIndicator.classList.add('offline');
            }

            if (statusText) {
                statusText.textContent = 'Click to start conversation';
            }

            // Ensure current chat button is not active initially
            if (currentChatBtn) {
                currentChatBtn.classList.remove('active');
            }

            console.log('Chat interface initialized successfully');
        }

        function toggleOnlineStatus() {
            // Only allow going online if today's chat exists
            if (!isOnline) {
                // Try to resume today's chat (no new chat creation)
                resumeTodaysChat();
            } else {
                // Go offline
                goOffline();
            }
        }


        function resumeTodaysChat() {
            console.log('Looking for today\'s chat...');

            // Find today's chat
            const today = new Date().toDateString();
            const todaysChat = chatHistory.find(chat =>
                new Date(chat.date).toDateString() === today
            );

            if (todaysChat) {
                currentChatId = todaysChat.id;
                goOnline();

                // Load existing messages
                if (todaysChat.messages.length > 0) {
                    loadChatFromHistory(todaysChat.id);
                } else {
                    // Show welcome message for empty chat
                    clearCurrentChatDisplay();
                }

                console.log('Resumed today\'s chat with ID:', currentChatId);
            } else {
                // No chat exists for today - show message and don't allow chat
                console.log('No chat exists for today - user cannot create new chats');
                showNoChatMessage();
            }
        }

        function showNoChatMessage() {
            // Update status to show no chat available
            if (statusText) {
                statusText.textContent = 'No chat available for today';
            }

            // Keep input disabled
            if (chatInput) {
                chatInput.disabled = true;
                chatInput.placeholder = 'No chat available for today';
            }
            if (sendBtn) {
                sendBtn.disabled = true;
            }

            // Show message in chat area
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="message ai-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            <p>No chat session is available for today. Please check back tomorrow for a new chat session.</p>
                            <span class="message-time">Just now</span>
                        </div>
                    </div>
                `;
            }
        }

        function goOnline() {
            isOnline = true;
            console.log('Going online...');

            // Update UI
            statusIndicator.classList.remove('offline');
            statusIndicator.classList.add('online');
            statusText.textContent = 'Online - Ready to chat!';

            // Enable input and button
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.placeholder = 'Type your message here...';
                chatInput.focus();
            }
            if (sendBtn) {
                sendBtn.disabled = false;
            }

            // Update current chat button
            if (currentChatBtn) {
                currentChatBtn.classList.add('active');
            }
        }

        function goOffline() {
            isOnline = false;
            console.log('Going offline...');

            // Update UI
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
            statusText.textContent = 'Click to start conversation';

            // Disable input and button
            if (chatInput) {
                chatInput.disabled = true;
                chatInput.placeholder = 'Click on AI Mentor to start chatting...';
                chatInput.value = '';
            }
            if (sendBtn) {
                sendBtn.disabled = true;
            }

            // Update current chat button
            if (currentChatBtn) {
                currentChatBtn.classList.remove('active');
            }

            // Clear current chat display
            clearCurrentChatDisplay();
        }

        function initializeDailyChat() {
            const today = new Date().toDateString();

            console.log('Initializing daily chat...');
            console.log('Today:', today);

            // Look for today's chat in history
            const todaysChat = chatHistory.find(chat =>
                new Date(chat.date).toDateString() === today
            );

            if (todaysChat) {
                // Today's chat exists
                currentChatId = todaysChat.id;
                todayChatStarted = true;
                console.log('Found existing chat for today:', currentChatId);
            } else {
                // No chat exists for today
                currentChatId = null;
                todayChatStarted = false;
                console.log('No chat exists for today - user cannot create new chats');
            }
        }


        function sendMessage() {
            console.log('sendMessage called, isOnline:', isOnline);

            if (!isOnline) {
                console.log('Not online, cannot send message');
                return;
            }

            if (!currentChatId) {
                console.log('No current chat ID, cannot send message');
                return;
            }

            const message = chatInput.value.trim();
            console.log('Message to send:', message);

            if (!message) {
                console.log('No message to send');
                return;
            }

            // Clear input immediately
            chatInput.value = '';
            console.log('Input cleared');

            // Add user message
            addMessage(message, 'user');
            console.log('User message added');

            // Save user message with real-time updates
            saveMessageToCurrentChat(message, 'user');
            console.log('User message saved');

            // Show typing indicator
            showTypingIndicator();
            console.log('Typing indicator shown');

            // Simulate AI response delay
            setTimeout(() => {
                hideTypingIndicator();
                const aiResponse = generateAIResponse(message);
                addMessage(aiResponse, 'ai');
                console.log('AI response added:', aiResponse);

                // Save AI response with real-time updates
                saveMessageToCurrentChat(aiResponse, 'ai');
                console.log('AI response saved');
            }, 1500 + Math.random() * 1000);
        }

        function addMessage(content, sender) {
            const chatMessages = document.getElementById('chat-messages');
            if (!chatMessages) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;

            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (sender === 'ai') {
                messageDiv.innerHTML = `
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <p>${content}</p>
                        <span class="message-time">${time}</span>
                    </div>
                `;
            } else {
                messageDiv.innerHTML = `
                    <div class="message-content">
                        <p>${content}</p>
                        <span class="message-time">${time}</span>
                    </div>
                `;
            }

            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function showTypingIndicator() {
            const chatMessages = document.getElementById('chat-messages');
            if (!chatMessages) return;

            // Remove any existing typing indicator
            hideTypingIndicator();

            // Create typing message
            const typingMessage = document.createElement('div');
            typingMessage.className = 'typing-message';
            typingMessage.id = 'typing-indicator-message';

            typingMessage.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span class="typing-text">AI Mentor is typing...</span>
                </div>
            `;

            chatMessages.appendChild(typingMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function hideTypingIndicator() {
            const typingMessage = document.getElementById('typing-indicator-message');
            if (typingMessage) {
                typingMessage.remove();
            }
        }

        function clearCurrentChatDisplay() {
            const chatMessages = document.getElementById('chat-messages');
            if (!chatMessages) return;

            chatMessages.innerHTML = `
                <div class="message ai-message">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <p>Hello! I'm your AI Mentor. Click on me to start our conversation!</p>
                        <span class="message-time">Just now</span>
                    </div>
                </div>
            `;
        }


        function toggleHistorySidebar() {
            const sidebar = document.getElementById('chat-history-sidebar');
            if (sidebar) {
                sidebar.classList.toggle('open');
            }
        }

        function loadChatHistory() {
            const historyList = document.getElementById('history-list');
            if (!historyList) return;

            historyList.innerHTML = '';

            if (chatHistory.length === 0) {
                historyList.innerHTML = `
                    <div class="no-history">
                        <div class="no-history-icon">💬</div>
                        <div class="no-history-text">No chat history yet</div>
                        <div class="no-history-subtext">Start a conversation to see it here</div>
                    </div>
                `;
                return;
            }

            chatHistory.forEach(chat => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.setAttribute('data-chat-id', chat.id);

                const date = new Date(chat.date);
                const dateStr = date.toLocaleDateString();

                // Use lastActivity time if available, otherwise use creation time
                const lastActivity = chat.lastActivity ? new Date(chat.lastActivity) : date;
                const timeStr = lastActivity.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Create a better preview with message count
                let preview = chat.preview || 'New conversation';
                if (chat.messageCount && chat.messageCount > 0) {
                    preview += ` (${chat.messageCount} messages)`;
                }

                historyItem.innerHTML = `
                    <div class="history-date">${dateStr}</div>
                    <div class="history-preview">${preview}</div>
                    <div class="history-time">${timeStr}</div>
                `;

                historyItem.addEventListener('click', () => {
                    loadChatFromHistory(chat.id);
                });

                historyList.appendChild(historyItem);
            });

            // Update current chat button state after loading history
            updateCurrentChatButtonState();
        }

        function updateCurrentChatButtonState() {
            if (!currentChatBtn) return;

            const today = new Date().toDateString();
            const isViewingTodayChat = currentChatId && chatHistory.find(chat =>
                chat.id === currentChatId && new Date(chat.date).toDateString() === today
            );

            if (isViewingTodayChat && isOnline) {
                currentChatBtn.classList.add('active');
            } else {
                currentChatBtn.classList.remove('active');
            }
        }

        function loadChatFromHistory(chatId) {
            const chat = chatHistory.find(c => c.id === chatId);
            if (!chat) return;

            currentChatId = chatId;
            const chatMessages = document.getElementById('chat-messages');
            if (!chatMessages) return;

            chatMessages.innerHTML = '';

            chat.messages.forEach(msg => {
                addMessage(msg.content, msg.sender);
            });

            // Update active history item
            document.querySelectorAll('.history-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = document.querySelector(`[data-chat-id="${chatId}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }

            // Update current chat button state
            if (currentChatBtn) {
                const today = new Date().toDateString();
                const isTodayChat = new Date(chat.date).toDateString() === today;

                if (isTodayChat) {
                    currentChatBtn.classList.add('active');
                } else {
                    currentChatBtn.classList.remove('active');
                }
            }
        }

        function saveMessageToCurrentChat(content, sender) {
            if (!currentChatId) {
                console.log('No current chat ID, cannot save message');
                return;
            }

            const chat = chatHistory.find(c => c.id === currentChatId);
            if (chat) {
                // Add message with real-time timestamp
                const now = new Date();
                chat.messages.push({
                    content: content,
                    sender: sender,
                    timestamp: now.toISOString()
                });

                // Update chat metadata in real-time
                chat.lastActivity = now.toISOString();
                chat.messageCount = chat.messages.length;

                // Update preview with last user message
                if (sender === 'user') {
                    chat.preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
                }

                // Save and update history in real-time
                saveChatHistory();
                updateHistoryInRealTime(chat);

                console.log('Message saved to chat:', currentChatId, 'Total messages:', chat.messageCount);
            } else {
                console.log('Chat not found with ID:', currentChatId);
            }
        }

        function updateHistoryInRealTime(updatedChat) {
            // Update the history list in real-time without full reload
            const historyList = document.getElementById('history-list');
            if (!historyList) return;

            // Find the history item for this chat
            const historyItem = document.querySelector(`[data-chat-id="${updatedChat.id}"]`);
            if (historyItem) {
                // Update the preview text
                const previewElement = historyItem.querySelector('.history-preview');
                if (previewElement) {
                    previewElement.textContent = updatedChat.preview || 'New conversation';
                }

                // Update the time
                const timeElement = historyItem.querySelector('.history-time');
                if (timeElement) {
                    const lastActivity = new Date(updatedChat.lastActivity);
                    timeElement.textContent = lastActivity.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                // Move to top if it's today's chat
                const today = new Date().toDateString();
                const isTodayChat = new Date(updatedChat.date).toDateString() === today;
                if (isTodayChat && historyItem.parentNode.firstChild !== historyItem) {
                    historyList.insertBefore(historyItem, historyList.firstChild);
                }
            }
        }

        function saveChatHistory() {
            localStorage.setItem('ai_mentor_chat_history', JSON.stringify(chatHistory));
        }

        function loadCurrentChat() {
            console.log('Loading current chat...');

            const today = new Date().toDateString();
            const existingChat = chatHistory.find(chat =>
                new Date(chat.date).toDateString() === today
            );

            if (existingChat) {
                currentChatId = existingChat.id;

                if (existingChat.messages.length > 0) {
                    // Load existing chat with messages
                    loadChatFromHistory(existingChat.id);
                } else {
                    // Show welcome message for empty chat
                    clearCurrentChatDisplay();
                }

                // Update current chat button
                if (currentChatBtn) {
                    currentChatBtn.classList.add('active');
                }

                console.log('Loaded current chat:', currentChatId);
            } else {
                console.log('No current chat found for today - showing no chat message');
                showNoChatMessage();
            }
        }
    }

    function sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();

        if (!message) return;

        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = generateAIResponse(message);
            addMessage(aiResponse, 'ai');
        }, 1000 + Math.random() * 2000);
    }

    function addMessage(content, sender) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = sender === 'ai' ? '🤖' : '👤';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${content}</p>
                <span class="message-time">${time}</span>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function generateAIResponse(userMessage) {
        const responses = [
            "That's a great question! Let me help you with that. Based on your profile, I'd recommend focusing on practical applications.",
            "I understand you're working on improving your skills. Here's a structured approach that might help you progress faster.",
            "Based on your career goals, I suggest exploring some additional resources and practice exercises. Would you like me to recommend some specific tasks?",
            "That's an interesting challenge! Let me break this down into smaller, manageable steps for you.",
            "I can see you're making good progress! Here are some advanced concepts you might want to explore next.",
            "Great question! This relates to your weak subject area. Let me provide some targeted guidance to help you improve.",
            "I'm here to support your learning journey! Based on your current skill level, here's what I recommend focusing on next."
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Task Suggester
    function setupTaskSuggester() {
        const refreshBtn = document.getElementById('refresh-tasks-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshTasks);
        }

        // Load tasks on initialization
        loadRecommendedTasks();

        // Set up daily auto-refresh
        setupDailyTaskRefresh();
    }

    function markTaskComplete(taskId) {
        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
        const completeBtn = taskCard.querySelector('.task-complete-btn');

        if (!taskCard.classList.contains('completed')) {
            taskCard.classList.add('completed');
            completeBtn.textContent = 'Completed';
            completeBtn.style.background = '#10B981';

            showNotification(`Task "${taskCard.querySelector('h4').textContent}" marked as complete!`, 'success');
            checkTaskCompletion();
        }
    }

    function refreshTasks() {
        const refreshBtn = document.getElementById('refresh-tasks-btn');
        if (refreshBtn) {
            refreshBtn.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                refreshBtn.style.transform = 'rotate(0deg)';
            }, 500);
        }

        // Load new tasks
        loadRecommendedTasks();
        showNotification('Tasks refreshed! New recommendations loaded.', 'success');
    }

    function setupDailyTaskRefresh() {
        const lastRefreshDate = localStorage.getItem('ai_mentor_last_task_refresh');
        const today = new Date().toDateString();

        // If it's a new day, refresh tasks
        if (lastRefreshDate !== today) {
            loadRecommendedTasks();
            localStorage.setItem('ai_mentor_last_task_refresh', today);
        }
    }

    async function loadRecommendedTasks() {
        try {
            // Get free time slots from backend
            const freeTimeSlots = await fetchFreeTimeSlotsFromBackend();

            // Get recommended tasks from backend (or generate locally if backend fails)
            const tasks = await fetchRecommendedTasksFromBackend(freeTimeSlots);

            // Render tasks
            renderTasks(tasks);

        } catch (error) {
            console.error('Error loading recommended tasks:', error);
            // Fallback to local generation
            const freeTimeSlots = getFreeTimeSlots();
            const tasks = generateTasksForTimeSlots(freeTimeSlots);
            renderTasks(tasks);
        }
    }

    function getFreeTimeSlots() {
        // This would integrate with your backend timetable data
        // For now, using dummy data that simulates your backend response
        const dummyTimeSlots = [
            {
                id: 1,
                startTime: "09:00",
                endTime: "10:30",
                duration: 90, // minutes
                day: "Monday"
            },
            {
                id: 2,
                startTime: "14:00",
                endTime: "15:30",
                duration: 90,
                day: "Monday"
            }
        ];

        // In real implementation, this would fetch from your backend
        // return fetch('/api/free-time-slots').then(response => response.json());
        return dummyTimeSlots;
    }

    // Backend integration function to fetch free time slots from timetable
    async function fetchFreeTimeSlotsFromBackend() {
        try {
            // Replace with your actual backend endpoint for timetable
            const response = await fetch('/api/student/timetable/free-slots', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}` // or your auth method
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch free time slots from timetable');
            }

            const data = await response.json();
            // Process the timetable data to extract free slots
            return processTimetableForFreeSlots(data.timetable);

        } catch (error) {
            console.error('Error fetching free time slots from timetable:', error);
            // Fallback to dummy data
            return getFreeTimeSlots();
        }
    }

    // Process timetable data to find free time slots
    function processTimetableForFreeSlots(timetable) {
        const freeSlots = [];
        const slotDuration = 60; // Fixed 1 hour duration

        // This would process your actual timetable structure
        // For now, using dummy structure that matches typical timetable format
        const dummyTimetable = [
            { day: 'Monday', time: '09:00', subject: null, isFree: true },
            { day: 'Monday', time: '10:00', subject: 'Math', isFree: false },
            { day: 'Monday', time: '11:00', subject: null, isFree: true },
            { day: 'Monday', time: '14:00', subject: null, isFree: true },
            { day: 'Monday', time: '15:00', subject: 'Physics', isFree: false }
        ];

        // Group consecutive free slots
        let currentSlot = null;
        dummyTimetable.forEach(slot => {
            if (slot.isFree) {
                if (!currentSlot) {
                    currentSlot = {
                        id: freeSlots.length + 1,
                        startTime: slot.time,
                        endTime: addMinutes(slot.time, slotDuration),
                        duration: slotDuration,
                        day: slot.day
                    };
                } else {
                    // Extend current slot if consecutive
                    currentSlot.endTime = addMinutes(slot.time, slotDuration);
                }
            } else {
                if (currentSlot) {
                    freeSlots.push(currentSlot);
                    currentSlot = null;
                }
            }
        });

        // Add the last slot if it exists
        if (currentSlot) {
            freeSlots.push(currentSlot);
        }

        return freeSlots;
    }

    // Helper function to add minutes to time string
    function addMinutes(timeString, minutes) {
        const [hours, mins] = timeString.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60);
        const newMins = totalMinutes % 60;
        return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    }

    // Backend integration for task recommendations
    async function fetchRecommendedTasksFromBackend(timeSlots) {
        try {
            const response = await fetch('/api/student/recommended-tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    freeTimeSlots: timeSlots,
                    studentProfile: JSON.parse(localStorage.getItem('ai_mentor_profile') || '{}')
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch recommended tasks');
            }

            const data = await response.json();
            return data.tasks; // Adjust based on your backend response structure

        } catch (error) {
            console.error('Error fetching recommended tasks:', error);
            // Fallback to local task generation
            return generateTasksForTimeSlots(timeSlots);
        }
    }

    function generateTasksForTimeSlots(timeSlots) {
        // Maximum 4 tasks total (one per field)
        const fieldTasks = [
            {
                id: 1,
                title: "Practice DSA Problems",
                description: "Solve 5 array-based problems to strengthen your foundation",
                icon: "📚",
                duration: 30,
                type: "coding",
                field: "weak_subject"
            },
            {
                id: 2,
                title: "Build a Mini Project",
                description: "Create a simple calculator using Python to practice OOP concepts",
                icon: "💻",
                duration: 60,
                type: "project",
                field: "skill"
            },
            {
                id: 3,
                title: "Read Documentation",
                description: "Study React.js documentation to improve your web development skills",
                icon: "📖",
                duration: 45,
                type: "learning",
                field: "career_goal"
            },
            {
                id: 4,
                title: "Communication Practice",
                description: "Practice explaining technical concepts to improve communication skills",
                icon: "💬",
                duration: 30,
                type: "communication",
                field: "communication_level"
            }
        ];

        // Group tasks by time slots (max 2 tasks per slot)
        const groupedTasks = [];
        const maxTasksPerSlot = 2;
        let taskIndex = 0;

        timeSlots.forEach((timeSlot, slotIndex) => {
            const tasksForThisSlot = [];
            const tasksToAssign = Math.min(maxTasksPerSlot, fieldTasks.length - taskIndex);

            for (let i = 0; i < tasksToAssign && taskIndex < fieldTasks.length; i++) {
                const task = fieldTasks[taskIndex];
                tasksForThisSlot.push({
                    ...task,
                    timeSlot: timeSlot,
                    slotIndex: slotIndex + 1
                });
                taskIndex++;
            }

            if (tasksForThisSlot.length > 0) {
                groupedTasks.push({
                    timeSlot: timeSlot,
                    tasks: tasksForThisSlot
                });
            }
        });

        return groupedTasks;
    }

    function renderTasks(groupedTasks) {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        taskList.innerHTML = '';

        groupedTasks.forEach((group, index) => {
            // Create time slot group container
            const timeSlotGroup = document.createElement('div');
            timeSlotGroup.className = 'time-slot-group';

            // Create time slot header
            const timeSlotHeader = document.createElement('div');
            timeSlotHeader.className = 'time-slot-header';
            timeSlotHeader.textContent = `${group.timeSlot.startTime} - ${group.timeSlot.endTime}`;

            // Create tasks container
            const timeSlotTasks = document.createElement('div');
            timeSlotTasks.className = 'time-slot-tasks';

            // Add tasks to this time slot
            group.tasks.forEach(task => {
                const taskCard = document.createElement('div');
                taskCard.className = 'task-card';
                taskCard.setAttribute('data-task-id', task.id);

                taskCard.innerHTML = `
                    <div class="task-icon">${task.icon}</div>
                    <div class="task-content">
                        <h4>${task.title}</h4>
                        <p>${task.description}</p>
                        <div class="task-meta">
                            <span class="task-time">${task.duration} min</span>
                        </div>
                    </div>
                    <button class="task-complete-btn" data-task-id="${task.id}">Mark Complete</button>
                `;

                // Add click handler for complete button
                const completeBtn = taskCard.querySelector('.task-complete-btn');
                completeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    markTaskComplete(task.id);
                });

                timeSlotTasks.appendChild(taskCard);
            });

            // Assemble the time slot group
            timeSlotGroup.appendChild(timeSlotHeader);
            timeSlotGroup.appendChild(timeSlotTasks);
            taskList.appendChild(timeSlotGroup);
        });
    }

    function checkTaskCompletion() {
        const taskCards = document.querySelectorAll('.task-card');
        const completedTasks = document.querySelectorAll('.task-card.completed');

        if (taskCards.length === completedTasks.length && taskCards.length > 0) {
            showQuizSection();
        }
    }

    function showQuizSection() {
        const quizSection = document.getElementById('quiz-section');
        if (quizSection) {
            quizSection.style.display = 'block';
            showNotification('All tasks completed! Quiz is now unlocked.', 'success');
        }
    }

    // Quiz Functionality
    function setupQuizEventListeners() {
        const startQuizBtn = document.getElementById('start-quiz-btn');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        const closeResultsBtn = document.getElementById('close-results-btn');

        if (startQuizBtn) startQuizBtn.addEventListener('click', startQuiz);
        if (prevBtn) prevBtn.addEventListener('click', previousQuestion);
        if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
        if (submitBtn) submitBtn.addEventListener('click', submitQuiz);
        if (closeResultsBtn) closeResultsBtn.addEventListener('click', closeResults);
    }

    function startQuiz() {
        quizState = {
            currentQuestion: 0,
            answers: [],
            isQuizActive: true,
            isQuizCompleted: false,
            startTime: new Date(),
            endTime: null
        };

        // Hide start button and results, show quiz content
        const startQuizBtn = document.getElementById('start-quiz-btn');
        const quizContent = document.getElementById('quiz-content');
        const quizResults = document.getElementById('quiz-results');

        if (startQuizBtn) startQuizBtn.style.display = 'none';
        if (quizContent) quizContent.style.display = 'block';
        if (quizResults) quizResults.style.display = 'none';

        // Load first question
        loadQuestion(0);
        updateQuizProgress();
    }

    function loadQuestion(questionIndex) {
        if (questionIndex < 0 || questionIndex >= quizQuestions.length) return;

        const question = quizQuestions[questionIndex];
        const questionText = document.getElementById('question-text');
        const quizOptions = document.getElementById('quiz-options');
        const currentQuestionSpan = document.getElementById('current-question');
        const totalQuestionsSpan = document.getElementById('total-questions');
        const questionNumberSpan = document.getElementById('question-number');
        const questionTypeSpan = document.getElementById('question-type');
        const questionTypeBadge = document.getElementById('question-type-badge');

        if (questionText) questionText.textContent = question.question;
        if (currentQuestionSpan) currentQuestionSpan.textContent = questionIndex + 1;
        if (totalQuestionsSpan) totalQuestionsSpan.textContent = quizQuestions.length;
        if (questionNumberSpan) questionNumberSpan.textContent = questionIndex + 1;

        // Update question type display
        const typeDisplay = getQuestionTypeDisplay(question.type);
        if (questionTypeSpan) questionTypeSpan.textContent = typeDisplay;
        if (questionTypeBadge) questionTypeBadge.textContent = typeDisplay;

        // Clear and populate options
        if (quizOptions) {
            quizOptions.innerHTML = '';

            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'quiz-option';
                optionElement.innerHTML = `
                    <input type="radio" name="question-${question.id}" value="${index}" id="option-${question.id}-${index}">
                    <label for="option-${question.id}-${index}">${option}</label>
                `;

                // Check if this option was previously selected
                if (quizState.answers[questionIndex] === index) {
                    optionElement.querySelector('input').checked = true;
                    optionElement.classList.add('selected');
                }

                // Add click handler
                optionElement.addEventListener('click', () => selectOption(questionIndex, index, optionElement));

                quizOptions.appendChild(optionElement);
            });
        }

        // Update navigation buttons
        updateNavigationButtons();
    }

    function getQuestionTypeDisplay(type) {
        const typeMap = {
            'career': 'Career Goals',
            'academic': 'Academic',
            'skill': 'Skills',
            'communication': 'Communication'
        };
        return typeMap[type] || 'General';
    }

    function selectOption(questionIndex, optionIndex, optionElement) {
        // Clear previous selection
        const allOptions = document.querySelectorAll(`input[name="question-${quizQuestions[questionIndex].id}"]`);
        allOptions.forEach(opt => {
            opt.closest('.quiz-option').classList.remove('selected');
        });

        // Select current option
        optionElement.classList.add('selected');
        optionElement.querySelector('input').checked = true;

        // Store answer
        quizState.answers[questionIndex] = optionIndex;

        // Update navigation buttons
        updateNavigationButtons();
    }

    function updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');

        if (prevBtn) {
            prevBtn.disabled = quizState.currentQuestion === 0;
        }

        if (nextBtn && submitBtn) {
            const isLastQuestion = quizState.currentQuestion === quizQuestions.length - 1;
            const hasAnswer = quizState.answers[quizState.currentQuestion] !== undefined;

            if (isLastQuestion) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = hasAnswer ? 'block' : 'none';
            } else {
                nextBtn.style.display = 'block';
                submitBtn.style.display = 'none';
                nextBtn.disabled = !hasAnswer;
            }
        }
    }

    function previousQuestion() {
        if (quizState.currentQuestion > 0) {
            quizState.currentQuestion--;
            loadQuestion(quizState.currentQuestion);
            updateQuizProgress();
        }
    }

    function nextQuestion() {
        if (quizState.currentQuestion < quizQuestions.length - 1) {
            quizState.currentQuestion++;
            loadQuestion(quizState.currentQuestion);
            updateQuizProgress();
        }
    }

    function updateQuizProgress() {
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            const progress = ((quizState.currentQuestion + 1) / quizQuestions.length) * 100;
            progressFill.style.width = `${progress}%`;
        }
    }

    function submitQuiz() {
        quizState.isQuizActive = false;
        quizState.isQuizCompleted = true;
        quizState.endTime = new Date();

        // Calculate score
        let correctCount = 0;
        quizQuestions.forEach((question, index) => {
            if (quizState.answers[index] === question.correctAnswer) {
                correctCount++;
            }
        });

        const score = correctCount;
        const percentage = Math.round((score / quizQuestions.length) * 100);

        // Update progress data
        updateProgressData(score, quizQuestions.length - score);

        // Show results
        showQuizResults(score, percentage);

        // Save quiz results
        saveQuizResults(score, percentage);
    }

    function showQuizResults(score, percentage) {
        const quizContent = document.getElementById('quiz-content');
        const quizResults = document.getElementById('quiz-results');
        const finalScore = document.getElementById('final-score');
        const maxScore = document.getElementById('max-score');
        const scorePercentage = document.getElementById('score-percentage');
        const scoreStatus = document.getElementById('score-status');
        const questionsList = document.getElementById('questions-list');
        const summaryGrid = document.getElementById('summary-grid');

        // Hide quiz content, show results
        if (quizContent) quizContent.style.display = 'none';
        if (quizResults) quizResults.style.display = 'block';

        // Update score display
        if (finalScore) finalScore.textContent = score;
        if (maxScore) maxScore.textContent = quizQuestions.length;
        if (scorePercentage) scorePercentage.textContent = `${percentage}%`;

        // Update score status
        if (scoreStatus) {
            if (percentage >= 80) {
                scoreStatus.textContent = 'Excellent work!';
            } else if (percentage >= 60) {
                scoreStatus.textContent = 'Good job!';
            } else {
                scoreStatus.textContent = 'Keep practicing!';
            }
        }

        // Generate all questions results
        if (questionsList) {
            questionsList.innerHTML = '';

            quizQuestions.forEach((question, index) => {
                const userAnswer = quizState.answers[index];
                const isCorrect = userAnswer === question.correctAnswer;
                const typeDisplay = getQuestionTypeDisplay(question.type);

                const questionItem = document.createElement('div');
                questionItem.className = `question-result-item ${isCorrect ? 'correct' : 'incorrect'}`;

                questionItem.innerHTML = `
                    <div class="question-result-icon">${isCorrect ? '✅' : '❌'}</div>
                    <div class="question-result-content">
                        <div class="question-result-header">
                            <div class="question-result-number">${index + 1}</div>
                            <div class="question-result-type">${typeDisplay}</div>
                        </div>
                        <div class="question-result-text">${question.question}</div>
                        <div class="question-result-answers">
                            <div class="answer-item user-answer">
                                <strong>Your answer:</strong> ${question.options[userAnswer] || 'Not answered'}
                            </div>
                            ${!isCorrect ? `
                                <div class="answer-item correct-answer">
                                    <strong>Correct answer:</strong> ${question.options[question.correctAnswer]}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;

                questionsList.appendChild(questionItem);
            });
        }


        // Update progress report with real-time data
        updateProgressFromQuiz(score, percentage);

        // Show progress report after quiz completion
        setTimeout(() => {
            showProgressReport();
        }, 2000);
    }

    function calculateCategoryStats() {
        const stats = {
            career: { correct: 0, total: 0 },
            academic: { correct: 0, total: 0 },
            skill: { correct: 0, total: 0 },
            communication: { correct: 0, total: 0 }
        };

        quizQuestions.forEach((question, index) => {
            const userAnswer = quizState.answers[index];
            const isCorrect = userAnswer === question.correctAnswer;

            stats[question.type].total++;
            if (isCorrect) {
                stats[question.type].correct++;
            }
        });

        return stats;
    }


    function closeResults() {
        const quizResults = document.getElementById('quiz-results');
        const quizHeader = document.querySelector('.quiz-header');
        const startQuizBtn = document.getElementById('start-quiz-btn');

        // Hide results
        if (quizResults) {
            quizResults.style.display = 'none';
        }

        // Show quiz header with "quiz done" message
        if (quizHeader) {
            quizHeader.innerHTML = `
                <div class="quiz-header-content">
                    <div class="quiz-icon">🎯</div>
                    <div class="quiz-title-section">
                        <h3>Today's Assessment Complete!</h3>
                        <p>Great job! Come back tomorrow for a fresh set of questions.</p>
                    </div>
                </div>
                <div class="quiz-done-message">
                    <div class="message-icon">📅</div>
                    <div class="message-content">
                        <h4>Assessment completed for today!</h4>
                        <p>Return tomorrow for new questions and continue your learning journey.</p>
                    </div>
                </div>
            `;
        }

        // Hide start button
        if (startQuizBtn) {
            startQuizBtn.style.display = 'none';
        }
    }

    function updateProgressData(correct, wrong) {
        progressData.weeklyStats.questionsAttempted += (correct + wrong);
        progressData.weeklyStats.correctAnswers += correct;
        progressData.weeklyStats.wrongAnswers += wrong;
        progressData.weeklyStats.totalQuestions += (correct + wrong);

        // Add to quiz history
        progressData.quizHistory.push({
            date: new Date(),
            score: correct,
            total: correct + wrong,
            percentage: Math.round((correct / (correct + wrong)) * 100)
        });

        // Save to localStorage
        saveProgressData();
    }

    function saveQuizResults(score, percentage) {
        const quizResults = {
            date: new Date().toISOString(),
            score: score,
            total: quizQuestions.length,
            percentage: percentage,
            timeSpent: quizState.endTime - quizState.startTime,
            answers: quizState.answers
        };

        // Save to localStorage
        const existingResults = JSON.parse(localStorage.getItem('ai_mentor_quiz_results') || '[]');
        existingResults.push(quizResults);
        localStorage.setItem('ai_mentor_quiz_results', JSON.stringify(existingResults));
    }

    // Progress Report Functionality
    let progressCharts = {};
    let weeklyProgressData = {
        career: { correct: 0, incorrect: 0, total: 0 },
        academic: { correct: 0, incorrect: 0, total: 0 },
        skill: { correct: 0, incorrect: 0, total: 0 },
        communication: { correct: 0, incorrect: 0, total: 0 },
        lastReset: new Date().toISOString()
    };

    function setupProgressReportListeners() {
        // No refresh button in new design
    }

    function showProgressReport() {
        const progressSection = document.getElementById('progress-report-section');
        if (progressSection) {
            progressSection.style.display = 'block';
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                updateProgressReport();
                initializeAllCharts();
            }, 200);
        }
    }

    function initializeAllCharts() {
        // Initialize charts for all categories
        const categories = ['career', 'academic', 'skill', 'communication'];
        categories.forEach(category => {
            const data = weeklyProgressData[category];
            updateCategoryChart(category, data.correct, data.incorrect, data.total);
        });
    }

    function updateProgressReport() {
        // Check for weekly reset
        checkWeeklyReset();

        // Update overall progress
        updateOverallProgress();

        // Update each category
        updateCategoryProgress('career');
        updateCategoryProgress('academic');
        updateCategoryProgress('skill');
        updateCategoryProgress('communication');

        // Update motivational message
        updateMotivationalMessage();
    }

    function updateOverallProgress() {
        const totalCorrect = weeklyProgressData.career.correct + weeklyProgressData.academic.correct +
            weeklyProgressData.skill.correct + weeklyProgressData.communication.correct;
        const totalQuestions = weeklyProgressData.career.total + weeklyProgressData.academic.total +
            weeklyProgressData.skill.total + weeklyProgressData.communication.total;

        const overallPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        const overallStatus = getOverallStatus(overallPercentage);

        // Store overall percentage for editing permissions
        localStorage.setItem('ai_mentor_overall_percentage', overallPercentage.toString());

        const percentageElement = document.getElementById('overall-percentage');
        const statusElement = document.getElementById('overall-status');

        if (percentageElement) percentageElement.textContent = `${overallPercentage}%`;
        if (statusElement) statusElement.textContent = overallStatus;

        // Update editing restrictions based on overall percentage
        updateEditRestriction();
    }

    function updateCategoryProgress(category) {
        const data = weeklyProgressData[category];
        const percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

        // Update stats
        document.getElementById(`${category}-correct`).textContent = data.correct;
        document.getElementById(`${category}-incorrect`).textContent = data.incorrect;
        document.getElementById(`${category}-total`).textContent = data.total;
        document.getElementById(`${category}-percentage`).textContent = `${percentage}%`;

        // Update chart
        updateCategoryChart(category, data.correct, data.incorrect, data.total);
    }

    function updateCategoryChart(category, correct, incorrect, total) {
        const canvasId = `${category}Chart`;
        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.log(`Canvas not found: ${canvasId}`);
            return;
        }

        const unattempted = Math.max(0, total - correct - incorrect);

        // Destroy existing chart if it exists
        if (progressCharts[category]) {
            progressCharts[category].destroy();
            delete progressCharts[category];
        }

        // Wait for DOM to be ready
        setTimeout(() => {
            try {
                // If no data, show a placeholder chart
                let chartData, chartColors, chartBorders;

                if (total === 0) {
                    // Show placeholder with 100% unattempted
                    chartData = [0, 0, 1];
                    chartColors = ['#E5E7EB', '#E5E7EB', '#E5E7EB'];
                    chartBorders = ['#D1D5DB', '#D1D5DB', '#D1D5DB'];
                } else {
                    // Show actual data
                    chartData = [correct, incorrect, unattempted];
                    chartColors = ['#10B981', '#EF4444', '#E5E7EB'];
                    chartBorders = ['#059669', '#DC2626', '#D1D5DB'];
                }

                // Create new chart with improved configuration
                progressCharts[category] = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Correct', 'Incorrect', 'Unattempted'],
                        datasets: [{
                            data: chartData,
                            backgroundColor: chartColors,
                            borderColor: chartBorders,
                            borderWidth: 2,
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '60%',
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                enabled: total > 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: 'white',
                                bodyColor: 'white',
                                borderColor: '#10B981',
                                borderWidth: 1
                            }
                        },
                        animation: {
                            animateRotate: true,
                            animateScale: true,
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        },
                        elements: {
                            arc: {
                                borderWidth: 2
                            }
                        }
                    }
                });

                console.log(`Chart created successfully for ${category} with data:`, chartData);
            } catch (error) {
                console.error(`Error creating chart for ${category}:`, error);
            }
        }, 100);
    }

    function updateMotivationalMessage() {
        const totalCorrect = weeklyProgressData.career.correct + weeklyProgressData.academic.correct +
            weeklyProgressData.skill.correct + weeklyProgressData.communication.correct;
        const totalQuestions = weeklyProgressData.career.total + weeklyProgressData.academic.total +
            weeklyProgressData.skill.total + weeklyProgressData.communication.total;

        const overallPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        const messageElement = document.getElementById('motivational-message');
        if (!messageElement) return;

        let message, icon;

        if (totalQuestions === 0) {
            icon = '💪';
            message = {
                title: 'Keep Going!',
                text: 'Start taking quizzes to see your progress and unlock your potential.'
            };
        } else if (overallPercentage >= 80) {
            icon = '🌟';
            message = {
                title: 'Outstanding Performance!',
                text: 'You\'re doing exceptionally well! Keep up the excellent work and continue to challenge yourself.'
            };
        } else if (overallPercentage >= 60) {
            icon = '📈';
            message = {
                title: 'Great Progress!',
                text: 'You\'re on the right track! Keep practicing and you\'ll reach excellence in no time.'
            };
        } else {
            icon = '💪';
            message = {
                title: 'Keep Pushing Forward!',
                text: 'Every expert was once a beginner. Stay consistent, practice regularly, and you\'ll see improvement!'
            };
        }

        messageElement.innerHTML = `
            <div class="message-icon">${icon}</div>
            <div class="message-content">
                <h4>${message.title}</h4>
                <p>${message.text}</p>
            </div>
        `;
    }

    function getOverallStatus(percentage) {
        if (percentage >= 80) return 'Excellent';
        if (percentage >= 60) return 'Good Progress';
        if (percentage > 0) return 'Needs Improvement';
        return 'Not Started';
    }

    function saveProgressData() {
        localStorage.setItem('ai_mentor_weekly_progress', JSON.stringify(weeklyProgressData));
    }

    function loadProgressData() {
        const savedData = localStorage.getItem('ai_mentor_weekly_progress');
        if (savedData) {
            weeklyProgressData = { ...weeklyProgressData, ...JSON.parse(savedData) };
            checkWeeklyReset();
        }
    }

    function checkWeeklyReset() {
        const now = new Date();
        const lastReset = new Date(weeklyProgressData.lastReset);
        const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

        if (daysSinceReset >= 7) {
            resetWeeklyProgress();
        }
    }

    function resetWeeklyProgress() {
        weeklyProgressData = {
            career: { correct: 0, incorrect: 0, total: 0 },
            academic: { correct: 0, incorrect: 0, total: 0 },
            skill: { correct: 0, incorrect: 0, total: 0 },
            communication: { correct: 0, incorrect: 0, total: 0 },
            lastReset: new Date().toISOString()
        };
        saveProgressData();
        updateProgressReport();
        showNotification('Weekly progress has been reset!', 'info');
    }

    // Real-time progress update from quiz results
    function updateProgressFromQuiz(quizResults) {
        const categoryStats = calculateCategoryStats();

        // Update weekly progress data
        Object.keys(categoryStats).forEach(category => {
            const stats = categoryStats[category];
            weeklyProgressData[category].correct += stats.correct;
            weeklyProgressData[category].incorrect += stats.incorrect;
            weeklyProgressData[category].total += stats.total;
        });

        // Save updated data
        saveProgressData();

        // Update the progress report display
        updateProgressReport();
    }

    // Utility Functions
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    function getEndOfWeek(date) {
        const start = getStartOfWeek(date);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return end;
    }

    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    // Notification System
    function showNotification(message, type = 'info') {
        const toast = document.getElementById('notification-toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Load student subjects from database
    async function loadStudentSubjects() {
        try {
            const response = await fetch('/api/student/subjects', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch student subjects');
            }

            const data = await response.json();
            updateWeakSubjectDropdown(data.subjects);

        } catch (error) {
            console.error('Error fetching student subjects:', error);
            // Keep default subjects if API fails
        }
    }

    function updateWeakSubjectDropdown(subjects) {
        const weakSubjectSelect = document.getElementById('weak-subject');
        if (!weakSubjectSelect) return;

        // Clear existing options except the first one
        weakSubjectSelect.innerHTML = '<option value="">Select subject</option>';

        // Add subjects from database
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.code || subject.name.toLowerCase().replace(/\s+/g, '-');
            option.textContent = subject.name;
            weakSubjectSelect.appendChild(option);
        });
    }

    // Initialize AI Mentor when DOM is ready
    initializeAIMentor();

    // Show initial alert if profile is empty
    setTimeout(() => {
        checkInitialProfileState();
        showProgressReport();
        loadStudentSubjects(); // Load subjects from database
        // Initialize charts after a delay to ensure DOM is ready
        setTimeout(() => {
            initializeAllCharts();
        }, 500);
    }, 1000);

    // initial data
    loadProfile();
    loadTimetable();
});







