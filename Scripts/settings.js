/**
 * Settings Page JavaScript
 * Handles all functionality for the settings page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Hiệu ứng cho các nút
    const actionButtons = document.querySelectorAll('.primary-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => {
                this.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
        });
    });

    // Hiệu ứng cho danger button
    const dangerButtons = document.querySelectorAll('.danger-btn');
    dangerButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => {
                this.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
        });
    });

    // Xử lý đăng xuất với modal sheet
    const logoutBtn = document.getElementById('logout-btn');
    const logoutModal = document.getElementById('logout-modal-overlay');
    const cancelLogoutBtn = document.getElementById('cancel-logout');
    const confirmLogoutBtn = document.getElementById('confirm-logout');

    // Mở modal sheet khi nhấn nút đăng xuất
    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutModal.classList.add('active');
        });
    }

    // Đóng modal khi nhấn nút hủy
    if (cancelLogoutBtn && logoutModal) {
        cancelLogoutBtn.addEventListener('click', function() {
            logoutModal.classList.remove('active');
        });
    }

    // Xử lý khi xác nhận đăng xuất
    if (confirmLogoutBtn && logoutModal) {
        confirmLogoutBtn.addEventListener('click', function() {
            // Thực hiện đăng xuất
            AleyAPI.Auth.logout();
            // Đóng modal (mặc dù sẽ chuyển hướng nhưng vẫn đóng để đảm bảo)
            logoutModal.classList.remove('active');
        });
    }

    // Đóng modal khi nhấn vào overlay
    if (logoutModal) {
        logoutModal.addEventListener('click', function(e) {
            // Chỉ đóng khi nhấn vào phần overlay, không phải nội dung modal
            if (e.target === logoutModal) {
                logoutModal.classList.remove('active');
            }
        });
    }

    // Thêm xử lý phím ESC để đóng modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && logoutModal && logoutModal.classList.contains('active')) {
            logoutModal.classList.remove('active');
        }
    });
}); 