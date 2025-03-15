/**
 * Right Sidebar Loader
 * 
 * This script dynamically loads the right sidebar from right-sidebar.html into any page
 * that includes this script.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Find the element where we want to load the right sidebar
    const rightSidebarContainer = document.querySelector('.right-sidebar-container');
    
    if (!rightSidebarContainer) {
        console.error('No right sidebar container found with class .right-sidebar-container');
        return;
    }
    
    // Fetch the right sidebar HTML content
    fetch('../Page/right-sidebar.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            // Insert the right sidebar HTML
            rightSidebarContainer.innerHTML = html;
            
            // Initialize right sidebar functionality after it's loaded
            initRightSidebar();
        })
        .catch(error => {
            console.error('Error loading right sidebar:', error);
        });
});

/**
 * Initialize right sidebar functionality
 */
function initRightSidebar() {
    // Xử lý hoạt động riêng của sidebar bên phải (nếu cần)
    
    // Xử lý các nút kết bạn
    const acceptButtons = document.querySelectorAll('.accept-btn');
    const rejectButtons = document.querySelectorAll('.reject-btn');
    
    acceptButtons.forEach(button => {
        button.addEventListener('click', function() {
            const friendItem = this.closest('.suggested-friend');
            const friendName = friendItem.querySelector('.friend-info h4').textContent;
            
            // Hiệu ứng khi chấp nhận kết bạn
            this.innerHTML = '<i class="fas fa-check"></i>';
            this.classList.add('accepted');
            
            // Thông báo chấp nhận
            setTimeout(() => {
                friendItem.innerHTML = `<div class="friend-accepted">Đã kết bạn với <strong>${friendName}</strong></div>`;
            }, 1000);
        });
    });
    
    rejectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const friendItem = this.closest('.suggested-friend');
            
            // Hiệu ứng khi từ chối kết bạn
            friendItem.style.opacity = '0';
            setTimeout(() => {
                friendItem.style.display = 'none';
            }, 300);
        });
    });
    
    // Xử lý thanh tìm kiếm
    const searchInput = document.querySelector('.search-input input');
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            this.parentElement.classList.add('active');
        });
        
        searchInput.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.parentElement.classList.remove('active');
            }
        });
    }
} 