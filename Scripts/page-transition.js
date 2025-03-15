/**
 * Page Transition Effect
 * 
 * Xử lý hiệu ứng chuyển đổi giữa các trang với animation mượt mà
 */

document.addEventListener('DOMContentLoaded', function() {
    // Tạo overlay element để hiệu ứng chuyển trang
    const overlayElement = document.createElement('div');
    overlayElement.className = 'page-transition-overlay';
    document.body.appendChild(overlayElement);
    
    // Bắt sự kiện click trên tất cả các link menu trong sidebar
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Chỉ xử lý các link trong cùng domain và không phải là anchor
            const href = this.getAttribute('href');
            
            // Bỏ qua các anchor link hoặc link ngoài
            if (href.startsWith('#') || href.includes('://')) {
                return;
            }
            
            // Ngăn hành vi mặc định
            e.preventDefault();
            
            // Lấy URL đích 
            const targetUrl = this.href;
            
            // Hiệu ứng fade out trước khi chuyển trang
            overlayElement.classList.add('active');
            
            // Thêm hiệu ứng cho menu item được chọn
            const menuItem = this.parentElement;
            menuItem.classList.add('active');
            
            // Chuyển trang sau một khoảng thời gian ngắn
            setTimeout(function() {
                window.location.href = targetUrl;
            }, 300);
        });
    });
    
    // Xử lý sự kiện khi load trang
    window.addEventListener('load', function() {
        // Hiệu ứng fade in khi trang đã load xong
        overlayElement.classList.remove('active');
    });
    
    // Xử lý khi người dùng ấn nút back/forward của trình duyệt
    window.addEventListener('popstate', function() {
        // Hiệu ứng fade out
        overlayElement.classList.add('active');
        
        // Reload trang sau 300ms
        setTimeout(function() {
            window.location.reload();
        }, 300);
    });
}); 