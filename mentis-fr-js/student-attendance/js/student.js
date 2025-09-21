$(document).ready(function () {
    // Navigation functionality
    $('.nav-link').on('click', function (e) {
        e.preventDefault();
        const target = $(this).data('target');

        // Remove active class from all nav links and content sections
        $('.nav-link').removeClass('active');
        $('.content-section').removeClass('active');

        // Add active class to clicked nav link and corresponding content section
        $(this).addClass('active');
        $(`#${target}`).addClass('active');
    });

    // Mobile menu toggle
    $('#menu-toggle').on('click', function () {
        $('#nav-links').toggleClass('show');
    });

    // Password change modal functionality
    $('#change-password-btn').on('click', function (e) {
        e.preventDefault();
        $('#password-modal').show();
    });

    $('#close-modal-btn').on('click', function () {
        $('#password-modal').hide();
    });

    // Password change form submission
    $('#password-change-form').on('submit', function (e) {
        e.preventDefault();
        const currentPassword = $('#current-password').val();
        const newPassword = $('#new-password').val();
        const confirmPassword = $('#confirm-password').val();

        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }

        // API call to change password
        fetch('/api/v1/users/updatepassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                oldPassword: currentPassword,
                newPassword: newPassword
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Password updated successfully', 'success');
                $('#password-modal').hide();
                $('#password-change-form')[0].reset();
            } else {
                showNotification(data.message || 'Error updating password', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error updating password', 'error');
        });
    });

    // Load user profile
    function loadProfile() {
        fetch('/api/v1/users/me', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const user = data.data;
                
                // Update profile information
                $('.student-name').text(user.name || 'Loading...');
                $('.detail-value').eq(0).text(user.name || 'Loading...');
                $('.detail-value').eq(5).text(user.rollNumber || 'Loading...');
                
                // Update avatar
                if (user.avatar) {
                    $('#summary-avatar').attr('src', user.avatar);
                    $('#main-profile-photo').attr('src', user.avatar);
                } else {
                    $('#summary-avatar').attr('src', 'https://placehold.co/110x110/2563EB/FFFFFF?text=' + (user.name ? user.name.charAt(0) : 'S'));
                    $('#main-profile-photo').attr('src', 'https://placehold.co/150x150/2563EB/FFFFFF?text=' + (user.name ? user.name.charAt(0) : 'S'));
                }
            }
        })
        .catch(error => {
            console.error('Error loading profile:', error);
        });
    }

    // Load attendance data and charts
    function loadAttendanceData() {
        // Attendance data loading functionality
        // This would include chart initialization and data loading
    }

    // Initialize DataTable for absentee records
    let table = $('#absentee-table').DataTable({
        responsive: true,
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        order: [[1, 'desc']], // Sort by date descending
        columnDefs: [
            { targets: '_all', className: 'text-center' }
        ],
        language: {
            emptyTable: "No absentee records found",
            info: "Showing _START_ to _END_ of _TOTAL_ records",
            infoEmpty: "No records available",
            lengthMenu: "Show _MENU_ records per page",
            search: "Search records:",
            paginate: {
                first: "First",
                last: "Last",
                next: "Next",
                previous: "Previous"
            }
        }
    });

    // Chart toggle functionality
    $('.chart-toggle-btn').on('click', function() {
        $('.chart-toggle-btn').removeClass('active');
        $(this).addClass('active');
        
        const chartType = $(this).data('chart');
        // Update chart based on type
    });

    // Filter functionality
    $('#subject-filter, #date-filter').on('change', function() {
        // Apply filters to the table
        table.draw();
    });

    // Notification function
    function showNotification(message, type = 'info') {
        const toast = $('#notification-toast');
        toast.removeClass('success error info warning').addClass(type);
        toast.text(message);
        toast.addClass('show');
        
        setTimeout(() => {
            toast.removeClass('show');
        }, 3000);
    }

    // Load timetable data
    function loadTimetable() {
        fetch('/api/v1/users/student-timetable', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const timetableList = $('.timetable-list');
                timetableList.empty();
                
                if (data.data.classes && data.data.classes.length > 0) {
                    data.data.classes.forEach(classItem => {
                        const listItem = `
                            <li class="timetable-item">
                                <div class="time">${classItem.startTime} - ${classItem.endTime}</div>
                                <div class="subject">${classItem.subject}</div>
                                <div class="room">${classItem.room || 'TBA'}</div>
                            </li>
                        `;
                        timetableList.append(listItem);
                    });
                } else {
                    timetableList.append('<li class="no-classes">No classes scheduled for today</li>');
                }
            }
        })
        .catch(error => {
            console.error('Error loading timetable:', error);
            $('.timetable-list').append('<li class="error">Error loading timetable</li>');
        });
    }

    // Initialize everything
    loadProfile();
    loadTimetable();
    loadAttendanceData();

    // Handle logout
    $('.logout-btn').on('click', function(e) {
        e.preventDefault();
        
        fetch('/api/v1/users/logout', {
            method: 'POST',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Error logging out:', error);
            window.location.href = '/';
        });
    });

    // Window resize handler for table
    $(window).on('resize', function () {
        setTimeout(function () {
            table.columns.adjust().draw(false);
        }, 100);
    });
});
