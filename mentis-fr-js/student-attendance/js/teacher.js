// Teacher dashboard logic
/* ============================================================================
   TEACHER DASHBOARD JAVASCRIPT
   ============================================================================
   
   This file contains all JavaScript functionality for the Teacher Dashboard:
   - API communication and authentication
   - Navigation and mobile menu handling
   - Profile management and modals
   - Live attendance management
   - Timetable management
   
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

    function setText(selector, text) {
        const el = document.querySelector(selector);
        if (el) el.textContent = text;
    }

    // Load teacher profile from backend
    async function loadProfile() {
        try {
            console.log('🔄 Loading teacher profile...');
            const resp = await apiRequest('/api/v1/users/me');
            console.log('📊 Profile API response:', resp);
            const base = resp?.data?.baseUser;
            const extra = resp?.data?.extraData;
            console.log('👤 Base user data:', base);
            console.log('📋 Extra teacher data:', extra);

            if (base) {
                setText('.teacher-name', base.name || '-');
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
                if (summaryAvatar) {
                    // For summary avatar, use a smaller size if it's a placeholder, otherwise use the same URL
                    if (imgUrl.includes('placehold.co')) {
                        summaryAvatar.src = imgUrl.replace('150x150', '110x110');
                    } else {
                        summaryAvatar.src = imgUrl;
                    }
                }
            }

            if (extra) {
                setText('.university-name', 'Silver Oak University');
                if (extra.department) setText('.department-name', extra.department);

                // Update summary card academic details
                const academicDetails = document.querySelector('.academic-details');
                if (academicDetails && extra.department && extra.designation) {
                    academicDetails.textContent = `Department of ${extra.department} • ${extra.designation}`;
                }

                const pi = extra.personalInfo || {};
                const map = new Map([
                    // Personal Information
                    ['Full Name:', base?.name || extra?.name || '-'],
                    ['Employee ID:', extra?.empId || '-'],
                    ['Date of Birth:', extra?.dateOfBirth || '-'],
                    ['Gender:', pi?.gender || '-'],
                    // Contact Information
                    ['Email:', base?.email || '-'],
                    ['Phone:', pi?.phoneNo || '-'],
                    ['Address:', pi?.address || '-'],
                    // Professional Information
                    ['Department:', extra?.department || '-'],
                    ['Designation:', extra?.designation || '-'],
                    ['Joining Year:', extra?.joiningYear || '-'],
                ]);

                // Handle teaching information separately
                if (extra?.courses && extra.courses.length > 0) {
                    const coursesText = extra.courses.map(course => course.name).join(', ');
                    setText('#teacher-courses', coursesText);
                } else {
                    setText('#teacher-courses', 'No courses assigned');
                }

                if (extra?.batchAssigned && extra.batchAssigned.length > 0) {
                    const batchesText = extra.batchAssigned.map(batch =>
                        `Batch ${batch.batchNo}`
                    ).join(', ');
                    setText('#teacher-batches', batchesText);
                } else {
                    setText('#teacher-batches', 'No batches assigned');
                }

                if (extra?.subjectTeaching && extra.subjectTeaching.length > 0) {
                    const subjectsText = extra.subjectTeaching.map(subject =>
                        `${subject.subject} (${subject.subjectCode}) - Batch ${subject.batchNo}`
                    ).join(', ');
                    setText('#teacher-subjects', subjectsText);
                } else {
                    setText('#teacher-subjects', 'No subjects assigned');
                }

                // Only update fields that have data, hide empty ones
                console.log('🔍 Processing profile fields...');
                document.querySelectorAll('#profile .detail-row').forEach((rowEl) => {
                    const labelEl = rowEl.querySelector('.detail-label');
                    const valueEl = rowEl.querySelector('.detail-value');
                    if (labelEl && valueEl && map.has(labelEl.textContent.trim())) {
                        const value = map.get(labelEl.textContent.trim());
                        console.log(`📝 Field: ${labelEl.textContent.trim()} = ${value}`);
                        if (value && value !== '-') {
                            valueEl.textContent = value;
                            rowEl.style.display = 'block';
                            console.log(`✅ Showing field: ${labelEl.textContent.trim()}`);
                        } else {
                            rowEl.style.display = 'none';
                            console.log(`❌ Hiding field: ${labelEl.textContent.trim()} (no data)`);
                        }
                    }
                });
            }
        } catch (e) {
            console.error('Failed to load profile:', e);
        }
    }

    // Load teacher timetable from backend
    async function loadTimetable() {
        try {
            console.log('🔄 Loading teacher timetable...');
            const resp = await apiRequest('/api/v1/users/teachertimetable');
            console.log('📊 Timetable API response:', resp);
            const classes = resp?.data?.classes || [];
            console.log('📚 Classes found:', classes.length);
            const list = document.querySelector('#timetable .timetable-list');

            if (list && classes.length) {
                console.log('📝 Rendering timetable items...');
                list.innerHTML = '';
                classes.forEach((c, index) => {
                    console.log(`📋 Class ${index + 1}:`, c);
                    const li = document.createElement('li');
                    li.className = 'timetable-item';
                    li.setAttribute('data-subject', c.subject);
                    li.setAttribute('data-time', `${c.startTime} - ${c.endTime}`);
                    li.innerHTML = `
                        <div class="timetable-info">
                            <h3>${c.subject}</h3>
                            <p><strong>Code:</strong> ${c.subjectCode || c.subject} | <strong>Classroom:</strong> ${c.room || '-'} | <strong>Time:</strong> ${c.startTime} - ${c.endTime}</p>
                        </div>
                        <div class="timetable-action">
                            <!-- QR functionality removed -->
                        </div>`;
                    list.appendChild(li);
                });
                console.log(`✅ Rendered ${classes.length} timetable items`);
            } else {
                console.log('⚠️ No timetable data found or list element missing');
            }
        } catch (e) {
            console.error('Failed to load timetable:', e);
        }
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

    // Password modal
    const passwordModal = document.getElementById('password-modal');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const passwordForm = document.getElementById('password-change-form');

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => passwordModal.style.display = 'block');
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            passwordModal.style.display = 'none';
            passwordForm.reset();
        });
    }
    window.addEventListener('click', (event) => {
        if (event.target == passwordModal) {
            passwordModal.style.display = 'none';
            passwordForm.reset();
        }
    });
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const correctCurrentPassword = 'password123';
            if (!currentPassword || !newPassword || !confirmPassword) return showToast('All fields are required.');
            if (currentPassword !== correctCurrentPassword) return showToast('Current password is incorrect.');
            if (newPassword !== confirmPassword) return showToast('New passwords do not match.');
            showToast('Password changed successfully!');
            passwordModal.style.display = 'none';
            passwordForm.reset();
        });
    }

    // QR functionality removed




    // Live Attendance modal + logic
    const liveModal = document.getElementById('live-modal');
    const liveCloseBtn = document.getElementById('live-close-btn');
    const liveMeta = document.getElementById('live-meta');
    const liveTbody = document.getElementById('live-tbody');
    const manualForm = document.getElementById('manual-add-form');
    const saveBtn = document.getElementById('save-attendance');
    const scannedSet = new Set();


    if (liveCloseBtn) {
        liveCloseBtn.addEventListener('click', () => { liveModal.style.display = 'none'; });
    }
    window.addEventListener('click', (event) => {
        if (event.target == liveModal) { liveModal.style.display = 'none'; }
    });


    function addRow({ name, enroll, batch }) {
        const key = `${enroll}`;
        if (scannedSet.has(key)) return; // avoid duplicates
        scannedSet.add(key);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${name}</td><td>${enroll}</td><td>${batch}</td><td><span class="status-pill">Present</span></td>`;
        liveTbody.prepend(tr);
    }

    // Manual add
    if (manualForm) {
        manualForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('manual-name').value.trim();
            const enroll = document.getElementById('manual-enroll').value.trim();
            const batch = document.getElementById('manual-batch').value.trim();
            if (!name || !enroll || !batch) return;
            addRow({ name, enroll, batch });
            manualForm.reset();
        });
    }


    // Save attendance
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const rows = Array.from(liveTbody.querySelectorAll('tr')).map(tr => {
                const tds = tr.querySelectorAll('td');
                return { name: tds[0].textContent, enroll: tds[1].textContent, batch: tds[2].textContent, status: 'Present' };
            });
            // For now just log; integrate with backend later
            console.log('Saving attendance:', rows);
            showToast('Attendance saved successfully');
            liveModal.style.display = 'none';
        });
    }

    function showToast(message) {
        const toast = document.getElementById('notification-toast');
        toast.textContent = message;
        toast.className = 'show';
        setTimeout(function () { toast.className = toast.className.replace('show', ''); }, 3000);
    }

    // Avatar upload functionality
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
            console.log('🔄 Uploading avatar...');
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
                console.log('📊 Avatar upload response:', json);
                if (!res.ok) throw new Error(json?.message || 'Failed to upload avatar');
                showToast('Avatar updated successfully');

                // Handle avatar URL properly
                const avatar = json?.data?.avatar;
                console.log('🖼️ Avatar URL from response:', avatar);
                if (avatar) {
                    const mainAvatar = document.getElementById('main-profile-photo');
                    const summaryAvatar = document.getElementById('summary-avatar');
                    console.log('🖼️ Main avatar element:', mainAvatar);
                    console.log('🖼️ Summary avatar element:', summaryAvatar);

                    // If avatar starts with /temp/, prepend the API base URL
                    const avatarUrl = avatar.startsWith('/temp/') ? `${API_BASE}${avatar}` : avatar;
                    console.log('🖼️ Final avatar URL:', avatarUrl);

                    if (mainAvatar) {
                        mainAvatar.src = avatarUrl;
                        console.log('✅ Updated main avatar');
                    }
                    if (summaryAvatar) {
                        summaryAvatar.src = avatarUrl;
                        console.log('✅ Updated summary avatar');
                    }
                } else {
                    console.log('⚠️ No avatar in response, reloading profile...');
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

    // Logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch(`${API_BASE}/api/v1/users/logout`, {
                    method: 'POST',
                    headers: { ...authHeaders },
                    credentials: 'include'
                });
            } catch (_) { }
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    // Load initial data
    loadProfile();
    loadTimetable();
});
