/**
 * Sidebar Loader
 * 
 * This script dynamically loads the sidebar menu from sidebar-menu.html into any page
 * that includes this script.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Find the element where we want to load the sidebar
    const sidebarContainer = document.querySelector('.sidebar-container');
    
    if (!sidebarContainer) {
        console.error('No sidebar container found with class .sidebar-container');
        return;
    }
    
    // Fetch the sidebar HTML content
    fetch('../Page/sidebar-menu.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            // Insert the sidebar HTML
            sidebarContainer.innerHTML = html;
            
            // Initialize sidebar functionality after it's loaded
            initSidebar();
            
            // Set active menu based on current page
            setActiveMenu();
            
            // Load user data into sidebar
            loadUserDataForSidebar();
        })
        .catch(error => {
            console.error('Error loading sidebar menu:', error);
        });
});

/**
 * Loads user data into the sidebar
 */
async function loadUserDataForSidebar() {
    try {
        // Check if user is logged in
        if (!AleyAPI.Auth.isLoggedIn()) {
            console.log('User not logged in. Sidebar user data will not be loaded.');
            return;
        }
        
        // Fetch current user data using the existing AleyAPI service
        const userData = await AleyAPI.User.getCurrentUser();
        
        // Update sidebar user profile elements
        updateSidebarUserProfile(userData);
        
    } catch (error) {
        console.error('Failed to load user data for sidebar:', error);
        // Don't show an error message in the sidebar to avoid disrupting the UI
    }
}

/**
 * Updates the sidebar user profile with fetched data
 * @param {Object} userData - The user data from the API
 */
function updateSidebarUserProfile(userData) {
    // Update avatar
    const avatarElement = document.querySelector('.sidebar .user-profile .avatar img');
    if (avatarElement) {
        const defaultAvatar = 'https://i.pravatar.cc/150?img=12'; // Default fallback avatar
        
        if (userData.avatar) {
            // Kiểm tra nếu avatar là URL (bắt đầu bằng http://, https://, hoặc blob:)
            if (userData.avatar.startsWith('http://') || userData.avatar.startsWith('https://') || userData.avatar.startsWith('blob:')) {
                avatarElement.src = userData.avatar;
            } else {
                // Nếu không phải URL, giả định đây là image_id và tạo URL đến API
                avatarElement.src = `${AleyAPI.baseUrl}/users/image/${userData.avatar}`;
            }
        } else {
            avatarElement.src = defaultAvatar;
        }
        
        avatarElement.alt = `${userData.fullName}'s avatar`;
    }
    
    // Update user name
    const nameElement = document.querySelector('.sidebar .user-profile .user-info h4');
    if (nameElement) {
        nameElement.textContent = userData.fullName || 'Người dùng Aley';
    }
    
    // Update username/email
    const usernameElement = document.querySelector('.sidebar .user-profile .user-info p');
    if (usernameElement) {
        // Using email as the username with @ prefix
        const email = userData.email || '';
        // Extract username part from email (before @)
        const username = email.split('@')[0];
        usernameElement.textContent = username ? `@${username}` : '@user';
    }
}

/**
 * Sets the active menu item based on current page URL
 */
function setActiveMenu() {
    // Get current page URL
    const currentPage = window.location.pathname;
    let activePage = '';
    
    // Extract page name from URL
    if (currentPage.includes('home.html')) {
        activePage = 'home';
    } else if (currentPage.includes('explore.html')) {
        activePage = 'explore';
    } else if (currentPage.includes('notifications')) {
        activePage = 'notifications';
    } else if (currentPage.includes('messages')) {
        activePage = 'messages';
    } else if (currentPage.includes('bookmarks')) {
        activePage = 'bookmarks';
    } else if (currentPage.includes('profile')) {
        activePage = 'profile';
    } else if (currentPage.includes('settings')) {
        activePage = 'settings';
    } else {
        // Default to home if no match
        activePage = 'home';
    }
    
    // Remove active class from all menu items
    const allMenuItems = document.querySelectorAll('.sidebar-menu li');
    allMenuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current page menu item
    const activeMenuItem = document.querySelector(`.sidebar-menu li[data-page="${activePage}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
        
        // Add a subtle animation to the active menu item
        activeMenuItem.classList.add('animate__animated', 'animate__pulse');
        setTimeout(() => {
            activeMenuItem.classList.remove('animate__animated', 'animate__pulse');
        }, 1000);
    }
}

/**
 * Initialize sidebar functionality
 */
function initSidebar() {
    // Hiệu ứng hover cho các menu
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.classList.add('hover');
            }
        });
        
        item.addEventListener('mouseleave', function() {
            this.classList.remove('hover');
        });
        
        // Add click event to handle menu navigation with active state
        item.addEventListener('click', function(e) {
            // Only if this is not already active
            if (!this.classList.contains('active')) {
                // Remove active class from all menu items
                menuItems.forEach(menuItem => {
                    menuItem.classList.remove('active');
                });
                
                // Add active class to clicked menu item
                this.classList.add('active');
            }
        });
    });
    
    // Hiệu ứng khi scroll
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop) {
            // Scroll xuống
            document.querySelector('.sidebar').classList.add('sidebar-hidden');
        } else {
            // Scroll lên
            document.querySelector('.sidebar').classList.remove('sidebar-hidden');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, false);
    
    // Xử lý chuyển đổi chế độ sáng/tối/hài hòa (vàng-nâu)
    const themeButtons = document.querySelectorAll('.theme-btn');
    const htmlElement = document.documentElement;
    
    // Hàm để thiết lập chế độ
    function setTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        
        // Lưu chế độ đã chọn vào localStorage
        localStorage.setItem('preferred-theme', theme);
        
        // Cập nhật trạng thái active cho nút
        themeButtons.forEach(btn => {
            if (btn.getAttribute('data-theme') === theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Kiểm tra xem người dùng đã chọn chế độ nào trước đó
    const savedTheme = localStorage.getItem('preferred-theme');
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Mặc định là chế độ sáng nếu không có lựa chọn trước đó
        setTheme('light');
    }
    
    // Thiết lập sự kiện khi click vào các nút chuyển đổi chế độ
    themeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            setTheme(theme);
            
            // Thêm hiệu ứng khi chuyển đổi
            this.classList.add('animate__animated', 'animate__rubberBand');
            setTimeout(() => {
                this.classList.remove('animate__animated', 'animate__rubberBand');
            }, 1000);
        });
    });
} 