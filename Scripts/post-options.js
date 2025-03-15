// Post Options
// Handles the options dropdown for posts (edit, delete, privacy settings, etc.)

class PostOptions {
    // Set up post options menu
    setupPostOptions(postElement, post) {
        const optionsButton = postElement.querySelector('.post-options i');
        const optionsDropdown = postElement.querySelector('.post-options-dropdown');
        
        if (!optionsButton || !optionsDropdown) return;
        
        // Check if user is logged in
        const isLoggedIn = !!localStorage.getItem('aley_token');
        if (!isLoggedIn) return;
        
        // Get current user info from localStorage (faster)
        const storedUserId = localStorage.getItem('aley_user_id');
        const storedUserEmail = localStorage.getItem('aley_user_email');
        const storedUserName = localStorage.getItem('aley_user_name');
        
        // Function to get current user ID
        const getCurrentUserId = async () => {
            // Prioritize using ID from localStorage if available
            if (storedUserId) {
                return storedUserId;
            }
            
            try {
                const userData = await AleyAPI.User.getCurrentUser();
                
                // Save user info to localStorage for future use
                if (userData.user_id || userData.id) {
                    const userId = userData.user_id || userData.id;
                    localStorage.setItem('aley_user_id', userId);
                    if (userData.email) localStorage.setItem('aley_user_email', userData.email);
                    if (userData.fullName) localStorage.setItem('aley_user_name', userData.fullName);
                    return userId;
                }
                return null;
            } catch (error) {
                return null;
            }
        };
        
        // Set up click event for options button
        optionsButton.addEventListener('click', async function(e) {
            e.stopPropagation();
            
            // Close all other dropdowns before opening this one
            document.querySelectorAll('.post-options-dropdown.active').forEach(dropdown => {
                if (dropdown !== optionsDropdown) {
                    dropdown.classList.remove('active');
                }
            });
            
            // Toggle dropdown
            optionsDropdown.classList.toggle('active');
            
            // If dropdown is open, update content based on post ownership
            if (optionsDropdown.classList.contains('active')) {
                optionsDropdown.innerHTML = '<div class="loading-options"><div class="loading-spinner"></div></div>';
                
                const currentUserId = await getCurrentUserId();
                
                // Check if post is temporary (created in current session)
                const isTemporaryPost = post.post_id && post.post_id.includes('temp_');
                
                // Check if post was created by current user based on name
                const isCreatedByCurrentUser = post.author && post.author.name === storedUserName;
                
                // Check post ownership using different methods
                const isOwnPostById = currentUserId && post.author && post.author.id === currentUserId;
                const isOwnPostByUserId = currentUserId && post.author && post.author.user_id === currentUserId;
                const isOwnPostBy_Id = currentUserId && post.author && post.author._id === currentUserId;
                const isOwnPostByEmail = storedUserEmail && post.author && post.author.email === storedUserEmail;
                const isOwnPostByName = storedUserName && post.author && post.author.name === storedUserName;
                
                // For demo purposes, treat some posts as user's own
                const mockIsOwnPost = post.post_id && (
                    post.post_id.includes('temp_') || // Temporary posts 
                    post.post_id.endsWith('1') || // Posts with IDs ending in 1
                    post.post_id.endsWith('4') // Posts with IDs ending in 4
                );
                
                // Check if post has explicit is_own_post flag (most reliable)
                const hasOwnPostFlag = post.is_own_post === true;
                
                // Combine all methods to determine post ownership
                const finalIsOwnPost = hasOwnPostFlag || isOwnPostById || isOwnPostByUserId || isOwnPostBy_Id || 
                                      isOwnPostByEmail || isOwnPostByName || isTemporaryPost || 
                                      isCreatedByCurrentUser || mockIsOwnPost;
                
                // Create options list based on post ownership
                let optionsHTML = '';
                
                if (finalIsOwnPost) {
                    // Options for user's own posts
                    optionsHTML = `
                        <div class="option-item edit-post">
                            <i class="fas fa-edit"></i>
                            <span>Chỉnh sửa bài viết</span>
                        </div>
                        <div class="option-item delete-post">
                            <i class="fas fa-trash-alt"></i>
                            <span>Xoá bài viết</span>
                        </div>
                        <div class="option-item privacy-settings">
                            <i class="fas fa-lock"></i>
                            <span>Cài đặt quyền riêng tư</span>
                        </div>
                    `;
                } else {
                    // Options for other users' posts
                    optionsHTML = `
                        <div class="option-item report-post">
                            <i class="fas fa-flag"></i>
                            <span>Báo cáo bài viết này</span>
                        </div>
                        <div class="option-item hide-post">
                            <i class="fas fa-eye-slash"></i>
                            <span>Ẩn bài viết này</span>
                        </div>
                        <div class="option-item save-post">
                            <i class="fas fa-bookmark"></i>
                            <span>Lưu bài viết này</span>
                        </div>
                    `;
                }
                
                optionsDropdown.innerHTML = optionsHTML;
                
                // Set up events for options
                if (finalIsOwnPost) {
                    // Edit post event
                    const editBtn = optionsDropdown.querySelector('.edit-post');
                    if (editBtn) {
                        editBtn.addEventListener('click', function() {
                            // Handle edit post
                            handlePostOptionAction('edit', post.post_id, postElement);
                            optionsDropdown.classList.remove('active');
                        });
                    }
                    
                    // Delete post event
                    const deleteBtn = optionsDropdown.querySelector('.delete-post');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function() {
                            if (confirm('Bạn có chắc chắn muốn xoá bài viết này không?')) {
                                // Handle delete post
                                handlePostOptionAction('delete', post.post_id, postElement);
                                optionsDropdown.classList.remove('active');
                            }
                        });
                    }
                    
                    // Privacy settings event
                    const privacyBtn = optionsDropdown.querySelector('.privacy-settings');
                    if (privacyBtn) {
                        privacyBtn.addEventListener('click', function() {
                            // Handle privacy settings
                            alert('Tính năng cài đặt quyền riêng tư đang được phát triển');
                            optionsDropdown.classList.remove('active');
                        });
                    }
                } else {
                    // Report post event
                    const reportBtn = optionsDropdown.querySelector('.report-post');
                    if (reportBtn) {
                        reportBtn.addEventListener('click', function() {
                            // Handle report post
                            handlePostOptionAction('report', post.post_id, postElement);
                            optionsDropdown.classList.remove('active');
                        });
                    }
                    
                    // Hide post event
                    const hideBtn = optionsDropdown.querySelector('.hide-post');
                    if (hideBtn) {
                        hideBtn.addEventListener('click', function() {
                            // Handle hide post
                            handlePostOptionAction('hide', post.post_id, postElement);
                            optionsDropdown.classList.remove('active');
                        });
                    }
                    
                    // Save post event
                    const saveBtn = optionsDropdown.querySelector('.save-post');
                    if (saveBtn) {
                        saveBtn.addEventListener('click', function() {
                            // Handle save post
                            handlePostOptionAction('save', post.post_id, postElement);
                            optionsDropdown.classList.remove('active');
                        });
                    }
                }
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.post-options') && optionsDropdown.classList.contains('active')) {
                optionsDropdown.classList.remove('active');
            }
        });
    }
}

// Create global instance
const postOptions = new PostOptions();

// Export for use in other modules
window.postOptions = postOptions;

/**
 * Handle post option menu actions
 */
function handlePostOptionAction(action, postId, postElement) {
    switch (action) {
        case 'edit':
            // Tìm các thông tin cần thiết của post để chỉnh sửa
            const contentElement = postElement.querySelector('.post-content p');
            
            // Get raw text content for editing (without hashtag formatting)
            let postContent = '';
            
            // Extract text content excluding emotion and location tags
            if (contentElement) {
                // Clone the content element to work with it safely
                const contentClone = contentElement.cloneNode(true);
                
                // Remove emotion and location elements from the clone to get clean text content
                const emotionElement = contentClone.querySelector('.post-emotion');
                const locationElement = contentClone.querySelector('.post-location');
                
                if (emotionElement) emotionElement.remove();
                if (locationElement) locationElement.remove();
                
                // Get text content of hashtags and other text
                postContent = contentClone.textContent || '';
            } else {
                postContent = '';
            }
            
            // Get privacy information
            const privacyIcon = postElement.querySelector('.post-author .author-info p i');
            let privacy = 'public'; // Mặc định là công khai
            
            // Xác định quyền riêng tư từ icon
            if (privacyIcon) {
                if (privacyIcon.classList.contains('fa-lock')) {
                    privacy = 'private';
                } else if (privacyIcon.classList.contains('fa-user-friends')) {
                    privacy = 'friends';
                }
            }
            
            // Lấy thông tin tác giả (avatar) nếu có
            const authorImg = postElement.querySelector('.post-author .avatar img');
            const authorAvatar = authorImg ? authorImg.src : null;
            
            // Get media elements if any
            const mediaContainer = postElement.querySelector('.post-media');
            const mediaHTML = mediaContainer ? mediaContainer.innerHTML.trim() : '';
            const hasValidMediaContent = mediaHTML.length > 10 && (
                mediaHTML.includes('<img') || 
                mediaHTML.includes('<video') || 
                mediaHTML.includes('post-media-item')
            );
            
            // Find emotion and location tags in the original content
            const originalEmotionElement = contentElement ? contentElement.querySelector('.post-emotion') : null;
            const originalLocationElement = contentElement ? contentElement.querySelector('.post-location') : null;
            
            // Chỉ lấy HTML khi phần tử thực sự tồn tại và có nội dung
            const emotionHTML = (originalEmotionElement && originalEmotionElement.innerHTML.trim().length > 0) 
                ? originalEmotionElement.outerHTML.trim() 
                : '';
                
            const locationHTML = (originalLocationElement && originalLocationElement.innerHTML.trim().length > 0) 
                ? originalLocationElement.outerHTML.trim() 
                : '';
            
            // Kiểm tra xem các phần tử đặc biệt có nội dung thực sự không
            const hasValidEmotion = emotionHTML.length > 0 && emotionHTML.includes('post-emotion');
            const hasValidLocation = locationHTML.length > 0 && locationHTML.includes('post-location');
            
            // Tạo đối tượng post để truyền vào modal với thông tin đầy đủ
            const post = {
                post_id: postId,
                content: postContent.trim(),
                privacy: privacy,
                author: { avatar: authorAvatar },
                // Chỉ đánh dấu có media/emotion/location khi thực sự có nội dung
                hasMedia: hasValidMediaContent,
                mediaHTML: hasValidMediaContent ? mediaHTML : undefined,
                emotionHTML: hasValidEmotion ? emotionHTML : undefined,
                locationHTML: hasValidLocation ? locationHTML : undefined,
                hasEmotion: hasValidEmotion,
                hasLocation: hasValidLocation
            };
            
            // Debug: In thông tin về bài viết và các phần tử đặc biệt của nó
            console.log(`Đang chuẩn bị chỉnh sửa bài viết ID: ${postId}`);
            console.log(`Media container tồn tại: ${!!mediaContainer}, Media HTML length: ${mediaHTML.length}, Valid: ${hasValidMediaContent}`);
            console.log(`Emotion element tồn tại: ${!!originalEmotionElement}, Valid: ${hasValidEmotion}`);
            console.log(`Location element tồn tại: ${!!originalLocationElement}, Valid: ${hasValidLocation}`);
            
            // Try with setTimeout to ensure DOM is ready
            setTimeout(() => {
                window.showEditPostModal(post);
                
                // Backup approach if normal call fails
                if (!document.querySelector('.edit-post-modal').classList.contains('active')) {
                    const modal = document.querySelector('.edit-post-modal');
                    const overlay = document.querySelector('.modal-overlay');
                    
                    if (modal && overlay) {
                        // Set content directly
                        const textarea = modal.querySelector('#edit-post-content');
                        if (textarea) textarea.value = post.content;
                        
                        // Force display
                        overlay.style.display = 'block';
                        overlay.classList.add('active');
                        modal.style.display = 'block';
                        modal.classList.add('active');
                        modal.style.transform = 'translateY(0)';
                    }
                }
            }, 100);
            break;
            
        case 'delete':
            // Xác nhận trước khi xóa bài viết
            if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
                // Thực hiện xóa bài viết (trong ứng dụng thực tế sẽ gọi API)
                
                // Hiệu ứng xóa trước khi xóa khỏi DOM
                postElement.style.opacity = '0';
                postElement.style.transform = 'scale(0.9)';
                
                setTimeout(() => {
                    postElement.style.height = postElement.offsetHeight + 'px';
                    postElement.style.overflow = 'hidden';
                    
                    setTimeout(() => {
                        postElement.style.height = '0';
                        postElement.style.margin = '0';
                        postElement.style.padding = '0';
                        
                        setTimeout(() => {
                            postElement.remove();
                        }, 300);
                    }, 200);
                }, 200);
            }
            break;
            
        case 'save':
            // Lưu bài viết (thực hiện lưu vào bookmark)
            const saveBtn = postElement.querySelector('.post-option-item[data-action="save"]');
            
            if (saveBtn) {
                // Thay đổi icon và text
                const wasActive = saveBtn.classList.contains('active');
                
                if (wasActive) {
                    // Đã lưu trước đó, giờ bỏ lưu
                    saveBtn.classList.remove('active');
                    saveBtn.innerHTML = '<i class="far fa-bookmark"></i> Lưu bài viết';
                    showToast('Đã bỏ lưu bài viết');
                } else {
                    // Chưa lưu, giờ lưu
                    saveBtn.classList.add('active');
                    saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Đã lưu';
                    showToast('Đã lưu bài viết');
                }
            }
            break;
            
        case 'report':
            // Báo cáo bài viết
            // Hiển thị biểu mẫu báo cáo hoặc hộp thoại
            alert('Chức năng báo cáo bài viết đang được phát triển');
            break;
            
        case 'hide':
            // Ẩn bài viết
            postElement.style.display = 'none';
            showToast('Đã ẩn bài viết');
            
            // Tùy chọn hiển thị nút hoàn tác
            const undoButton = document.createElement('div');
            undoButton.className = 'undo-hide';
            undoButton.innerHTML = 'Bài viết đã bị ẩn. <button>Hoàn tác</button>';
            undoButton.querySelector('button').addEventListener('click', () => {
                postElement.style.display = 'block';
                undoButton.remove();
                showToast('Đã hoàn tác bài viết');
            });
            
            // Chèn nút hoàn tác vào vị trí của bài viết
            postElement.parentNode.insertBefore(undoButton, postElement.nextSibling);
            
            // Tự động xóa sau 10 giây
            setTimeout(() => {
                if (document.body.contains(undoButton)) {
                    undoButton.remove();
                }
            }, 10000);
            break;
            
        default:
            // Hành động không được hỗ trợ
    }
}

/**
 * Hiển thị thông báo toast
 */
function showToast(message, type = 'success') {
    // Check if a toast container exists, if not create one
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
        
        // Add some basic styles
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.left = '50%';
        toastContainer.style.transform = 'translateX(-50%)';
        toastContainer.style.zIndex = '2000';
        toastContainer.style.display = 'flex';
        toastContainer.style.flexDirection = 'column';
        toastContainer.style.alignItems = 'center';
        toastContainer.style.gap = '10px';
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}-toast`;
    toast.textContent = message;
    
    // Choose color based on type
    let bgColor = 'var(--primary-color, #3b82f6)';
    if (type === 'error') {
        bgColor = 'var(--error-color, #ef4444)';
    } else if (type === 'warning') {
        bgColor = 'var(--warning-color, #f59e0b)';
    }
    
    // Style the toast
    toast.style.backgroundColor = bgColor;
    toast.style.color = '#fff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            
            // Remove from DOM after transition
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }, 10);
} 