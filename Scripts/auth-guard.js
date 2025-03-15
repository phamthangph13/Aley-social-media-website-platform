/**
 * Authentication Guard
 * Ensures all pages in the Page directory require authentication
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if this is a page that requires authentication (all pages in the /Page directory)
    const currentPath = window.location.pathname;
    const isPageDirectory = currentPath.includes('/Page/') || 
                           currentPath.endsWith('/Page/') ||
                           // Handle specific page filenames directly
                           [
                               '/home.html', 
                               '/profile.html', 
                               '/explore.html', 
                               '/messages.html', 
                               '/notifications.html', 
                               '/bookmarks.html', 
                               '/settings.html'
                           ].some(page => currentPath.endsWith(page));
    
    // If this is a page that requires authentication
    if (isPageDirectory) {
        // Check if user is logged in using the existing AleyAPI
        if (!AleyAPI.Auth.isLoggedIn()) {
            // If not logged in, redirect to login page
            console.log('Authentication required. Redirecting to login page.');
            // Show a brief message to the user
            const redirectMessage = document.createElement('div');
            redirectMessage.style.position = 'fixed';
            redirectMessage.style.top = '0';
            redirectMessage.style.left = '0';
            redirectMessage.style.width = '100%';
            redirectMessage.style.padding = '15px';
            redirectMessage.style.backgroundColor = '#f8d7da';
            redirectMessage.style.color = '#721c24';
            redirectMessage.style.textAlign = 'center';
            redirectMessage.style.zIndex = '9999';
            redirectMessage.textContent = 'Bạn cần đăng nhập để truy cập trang này. Đang chuyển hướng...';
            document.body.prepend(redirectMessage);
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = '../index.html';  // Redirect to the main login page
            }, 1500);
        }
    }
}); 