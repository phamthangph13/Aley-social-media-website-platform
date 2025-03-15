// Post Interactions
// Handles likes, comments, and shares for posts

class PostInteractions {
    // Set up like button functionality
    setupLikeButton(likeButton, postId) {
        likeButton.addEventListener('click', function() {
            this.classList.toggle('liked');
            const icon = this.querySelector('i');
            const likeCountElement = this.closest('.post-footer').querySelector('.likes span');
            let likeCount = parseInt(likeCountElement.textContent);
            
            if (this.classList.contains('liked')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                likeCountElement.textContent = likeCount + 1;
                
                // Heart bouncing animation
                icon.classList.add('animate__animated', 'animate__heartBeat');
                setTimeout(() => {
                    icon.classList.remove('animate__animated', 'animate__heartBeat');
                }, 1000);
                
                // Call API to like post if apiService exists
                if (typeof apiService !== 'undefined' && apiService.posts) {
                    apiService.posts.toggleLike(postId)
                        .catch(error => {
                            console.error('Error liking post:', error);
                            this.classList.remove('liked');
                            icon.classList.remove('fas');
                            icon.classList.add('far');
                            likeCountElement.textContent = likeCount;
                        });
                }
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                likeCountElement.textContent = Math.max(0, likeCount - 1);
                
                // Call API to unlike post if apiService exists
                if (typeof apiService !== 'undefined' && apiService.posts) {
                    apiService.posts.toggleLike(postId)
                        .catch(error => {
                            console.error('Error unliking post:', error);
                            this.classList.add('liked');
                            icon.classList.remove('far');
                            icon.classList.add('fas');
                            likeCountElement.textContent = likeCount;
                        });
                }
            }
        });
    }

    // Set up comment functionality
    setupCommentButton(commentButton, postId) {
        commentButton.addEventListener('click', function() {
            // Placeholder for comment functionality
            console.log('Comment button clicked for post:', postId);
            
            // Get or create comment section
            const postCard = this.closest('.post-card');
            let commentSection = postCard.querySelector('.comment-section');
            
            if (!commentSection) {
                commentSection = document.createElement('div');
                commentSection.className = 'comment-section';
                commentSection.innerHTML = `
                    <div class="comment-input">
                        <div class="avatar">
                            <img src="${localStorage.getItem('aley_user_avatar') || '../assets/images/default-avatar.png'}" alt="Avatar">
                        </div>
                        <div class="input-container">
                            <textarea placeholder="Viết bình luận..."></textarea>
                            <button class="send-comment"><i class="fas fa-paper-plane"></i></button>
                        </div>
                    </div>
                    <div class="comment-list">
                        <!-- Comments will be loaded here -->
                    </div>
                `;
                
                // Insert comment section before footer
                const postFooter = postCard.querySelector('.post-footer');
                postCard.insertBefore(commentSection, postFooter.nextSibling);
                
                // Focus on textarea
                setTimeout(() => {
                    commentSection.querySelector('textarea').focus();
                }, 100);
                
                // Set up send comment button
                const sendCommentBtn = commentSection.querySelector('.send-comment');
                sendCommentBtn.addEventListener('click', () => {
                    const textarea = commentSection.querySelector('textarea');
                    const commentText = textarea.value.trim();
                    
                    if (commentText) {
                        this.addComment(postId, commentText, commentSection);
                        textarea.value = '';
                    }
                });
                
                // Allow pressing Enter to send comment
                const textarea = commentSection.querySelector('textarea');
                textarea.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const commentText = textarea.value.trim();
                        
                        if (commentText) {
                            this.addComment(postId, commentText, commentSection);
                            textarea.value = '';
                        }
                    }
                });
            } else {
                // Toggle comment section visibility
                commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
                
                if (commentSection.style.display === 'block') {
                    // Focus on textarea when showing
                    setTimeout(() => {
                        commentSection.querySelector('textarea').focus();
                    }, 100);
                }
            }
        }.bind(this));
    }

    // Add a new comment
    addComment(postId, commentText, commentSection) {
        // Get current user info
        const userName = localStorage.getItem('aley_user_name') || 'Người dùng Aley';
        const userAvatar = localStorage.getItem('aley_user_avatar') || '../assets/images/default-avatar.png';
        
        // Create comment element
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item animate__animated animate__fadeIn';
        commentElement.innerHTML = `
            <div class="avatar">
                <img src="${userAvatar}" alt="Avatar">
            </div>
            <div class="comment-content">
                <div class="comment-author">${userName}</div>
                <div class="comment-text">${commentText}</div>
                <div class="comment-actions">
                    <span class="like-comment">Thích</span>
                    <span class="reply-comment">Trả lời</span>
                    <span class="comment-time">Vừa xong</span>
                </div>
            </div>
        `;
        
        // Add to comment list
        const commentList = commentSection.querySelector('.comment-list');
        commentList.insertBefore(commentElement, commentList.firstChild);
        
        // Update comment count
        const commentCountElement = commentSection.closest('.post-card').querySelector('.comments span');
        const commentCount = parseInt(commentCountElement.textContent);
        commentCountElement.textContent = commentCount + 1;
        
        // Call API to add comment if apiService exists
        if (typeof apiService !== 'undefined' && apiService.comments) {
            apiService.comments.addComment(postId, commentText)
                .then(response => {
                    console.log('Comment added successfully:', response);
                })
                .catch(error => {
                    console.error('Error adding comment:', error);
                });
        }
    }

    // Set up share functionality
    setupShareButton(shareButton, postId) {
        shareButton.addEventListener('click', function() {
            // Placeholder for share functionality
            alert('Tính năng chia sẻ bài viết đang được phát triển');
        });
    }
}

// Create global instance
const postInteractions = new PostInteractions();

// Export for use in other modules
window.postInteractions = postInteractions;

// Handle friend request functionality
function setupFriendRequestButtons() {
    console.log("Setting up friend request buttons...");
    
    // Find all add friend buttons in the document
    const addFriendButtons = document.querySelectorAll('.add-friend-btn');
    console.log(`Found ${addFriendButtons.length} add friend buttons`);
    
    // Add click event to each button
    addFriendButtons.forEach(button => {
        if (button.dataset.initialized === 'true') {
            console.log('Button already initialized, skipping');
            return; // Skip if already initialized
        }
        
        button.dataset.initialized = 'true';
        
        // Check button state on load
        const postElement = button.closest('.post-card');
        if (postElement) {
            const postId = postElement.dataset.postId;
            const authorElement = postElement.querySelector('.post-author .author-info h4');
            const authorName = authorElement ? authorElement.textContent.trim().replace(' (Bạn)', '') : 'Unknown';
            const authorId = button.dataset.userId || `user_${postId}`; // Use data-user-id if available, otherwise generate one
            
            // Store the user ID on the button for later use
            button.dataset.userId = authorId;
            button.dataset.userName = authorName;
            
            // Check friendship status via API if available
            if (typeof apiService !== 'undefined' && apiService.friends && apiService.friends.checkFriendshipStatus) {
                checkAndUpdateFriendshipStatus(button, authorId, authorName);
            }
        }
        
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Nếu nút đã có class is-friend, sự kiện đã được xử lý bởi showFriendOptionsSheet
            if (this.classList.contains('is-friend')) {
                return; 
            }
            
            // Get the post element and post ID
            const postElement = this.closest('.post-card');
            const postId = postElement?.dataset.postId;
            
            // Get the author name and ID
            const authorName = this.dataset.userName || postElement.querySelector('.post-author .author-info h4').textContent.trim().replace(' (Bạn)', '');
            const authorId = this.dataset.userId;
            
            // Check if user is logged in
            if (!localStorage.getItem('aley_token')) {
                // Show login prompt
                showLoginPrompt('Bạn cần đăng nhập để gửi lời mời kết bạn');
                return;
            }
            
            // If the button is already in "sent" state, cancel the request directly
            if (this.classList.contains('sent')) {
                try {
                    const requestId = this.dataset.requestId;
                    if (requestId && typeof apiService !== 'undefined' && apiService.friends) {
                        // Đánh dấu nút này đang được cập nhật
                        this.dataset.updating = 'true';
                        
                        await apiService.friends.cancelFriendRequest(requestId);
                        
                        // Update button state
                        this.innerHTML = '<i class="fas fa-user-plus"></i><span>Kết bạn</span>';
                        this.classList.remove('sent');
                        
                        // Update all buttons for the same user
                        updateAllFriendButtonsForUser(authorId, 'default');
                        
                        // Show notification
                        showToast('success', 'Đã hủy lời mời kết bạn', `Bạn đã hủy lời mời kết bạn với ${authorName}`);
                    }
                } catch (error) {
                    console.error('Error canceling friend request:', error);
                    showToast('error', 'Lỗi', 'Không thể hủy lời mời kết bạn. Vui lòng thử lại sau.');
                }
                return;
            }
            
            // If the button is in "received" state, accept the request
            if (this.classList.contains('received')) {
                try {
                    const requestId = this.dataset.requestId;
                    if (requestId && typeof apiService !== 'undefined' && apiService.friends) {
                        // Đánh dấu nút này đang được cập nhật
                        this.dataset.updating = 'true';
                        
                        const response = await apiService.friends.acceptFriendRequest(requestId);
                        
                        // Update button to "Friends" state
                        this.innerHTML = '<i class="fas fa-user-check"></i><span>Bạn bè</span>';
                        this.classList.remove('received');
                        this.classList.add('is-friend');
                        
                        // Store friendship ID if available
                        if (response.success && response.data && response.data.friendship_id) {
                            this.dataset.friendshipId = response.data.friendship_id;
                            
                            // Update all buttons for the same user
                            updateAllFriendButtonsForUser(authorId, 'is-friend', null, response.data.friendship_id);
                        }
                        
                        // Add event listener for friend options
                        this.removeEventListener('click', arguments.callee);
                        this.addEventListener('click', showFriendOptionsSheet);
                        
                        // Show notification
                        showToast('success', 'Đã chấp nhận lời mời kết bạn', `Bạn và ${authorName} đã trở thành bạn bè`);
                    }
                } catch (error) {
                    console.error('Error accepting friend request:', error);
                    showToast('error', 'Lỗi', 'Không thể chấp nhận lời mời kết bạn. Vui lòng thử lại sau.');
                }
                return;
            }
            
            // Update button appearance immediately for better UX - default case: sending friend request
            this.innerHTML = '<i class="fas fa-user-clock"></i><span>Đã gửi</span>';
            this.classList.add('sent');
            
            // Call API to send friend request
            try {
                if (typeof apiService !== 'undefined' && apiService.friends) {
                    // Đánh dấu nút này đang được cập nhật
                    this.dataset.updating = 'true';
                    
                    const response = await apiService.friends.sendFriendRequest(authorId);
                    console.log('Friend request sent:', response);
                    
                    // Store the request ID on the button for cancel operations
                    if (response.success && response.data && response.data.request_id) {
                        this.dataset.requestId = response.data.request_id;
                        
                        // Show success notification
                        showToast('success', 'Đã gửi lời mời kết bạn', `Bạn đã gửi lời mời kết bạn đến ${authorName}`);
                        
                        // Update all buttons for the same user
                        updateAllFriendButtonsForUser(authorId, 'sent', response.data.request_id);
                    }
                }
            } catch (error) {
                console.error('Error sending friend request:', error);
                
                // Kiểm tra xem lỗi có phải do đã gửi lời mời kết bạn cho người này rồi hay không
                if (error.message && error.message.includes('đã gửi lời mời kết bạn cho người này rồi')) {
                    // Đây là trường hợp lỗi 409 CONFLICT - đã gửi lời mời rồi
                    console.log('Already sent friend request to this user');
                    
                    // Cập nhật giao diện nút thành "Huỷ lời mời"
                    this.innerHTML = '<i class="fas fa-user-clock"></i><span>Hủy lời mời</span>';
                    this.classList.add('sent');
                    
                    // Thử lấy request_id từ lỗi nếu có
                    if (error.request_id) {
                        this.dataset.requestId = error.request_id;
                    }
                    
                    // Hiển thị thông báo thích hợp
                    showToast('info', 'Đã gửi trước đó', `Bạn đã gửi lời mời kết bạn đến ${authorName} trước đó`);
                    
                    // Gọi kiểm tra lại trạng thái để cố gắng lấy request_id nếu chưa có
                    if (!this.dataset.requestId) {
                        try {
                            checkAndUpdateFriendshipStatus(this, authorId, authorName);
                        } catch (checkError) {
                            console.error('Error checking friendship status:', checkError);
                        }
                    }
                } else {
                    // Các lỗi khác - quay lại trạng thái ban đầu
                    this.innerHTML = '<i class="fas fa-user-plus"></i><span>Kết bạn</span>';
                    this.classList.remove('sent');
                    
                    // Show error notification
                    showToast('error', 'Lỗi', 'Không thể gửi lời mời kết bạn. Vui lòng thử lại sau.');
                }
            }
        });
    });
}

/**
 * Check friendship status and update button appearance
 * @param {HTMLElement} button - The add friend button
 * @param {string} userId - The user ID to check
 * @param {string} userName - The user name for notifications
 */
async function checkAndUpdateFriendshipStatus(button, userId, userName) {
    console.log(`Checking friendship status for user: ${userName} (${userId})`);
    
    try {
        const response = await apiService.friends.checkFriendshipStatus(userId);
        console.log(`Friendship status response for ${userName}:`, response);
        
        if (response.success && response.data) {
            const { status, request_id, friendship_id } = response.data;
            console.log(`Friendship status for ${userName}: ${status}`);
            
            switch (status) {
                case 'friends':
                    // Already friends - show friends button with options
                    console.log(`${userName} is already a friend, updating to Friends button`);
                    button.innerHTML = '<i class="fas fa-user-check"></i><span>Bạn bè</span>';
                    button.classList.remove('sent', 'received');
                    button.classList.add('is-friend');
                    if (friendship_id) {
                        button.dataset.friendshipId = friendship_id;
                    }
                    button.dataset.userId = userId;
                    button.dataset.userName = userName;
                    
                    // Gắn sự kiện click để hiển thị sheet tùy chọn
                    button.addEventListener('click', showFriendOptionsSheet);
                    
                    // Cập nhật tất cả các nút khác cho người dùng này
                    updateAllFriendButtonsForUser(userId, 'is-friend', null, friendship_id);
                    break;
                    
                case 'pending_sent':
                    // Friend request already sent
                    console.log(`Friend request already sent to ${userName}, updating button`);
                    button.innerHTML = '<i class="fas fa-user-clock"></i><span>Hủy lời mời</span>';
                    button.classList.add('sent');
                    button.classList.remove('is-friend', 'received');
                    if (request_id) {
                        button.dataset.requestId = request_id;
                    }
                    
                    // Cập nhật tất cả các nút khác cho người dùng này
                    updateAllFriendButtonsForUser(userId, 'sent', request_id);
                    break;
                
                case 'pending_received':
                    // Friend request received
                    console.log(`Friend request received from ${userName}, updating button`);
                    button.innerHTML = '<i class="fas fa-user-plus"></i><span>Chấp nhận</span>';
                    button.classList.add('received');
                    button.classList.remove('is-friend', 'sent');
                    if (request_id) {
                        button.dataset.requestId = request_id;
                    }
                    
                    // Cập nhật tất cả các nút khác cho người dùng này
                    updateAllFriendButtonsForUser(userId, 'received', request_id);
                    break;
                    
                case 'not_friends':
                default:
                    // Not friends - keep default button state
                    console.log(`Not friends with ${userName}, keeping default button state`);
                    button.innerHTML = '<i class="fas fa-user-plus"></i><span>Kết bạn</span>';
                    button.classList.remove('is-friend', 'sent', 'received');
                    break;
            }
        } else {
            console.warn(`Invalid response when checking friendship status for ${userName}:`, response);
        }
    } catch (error) {
        console.error(`Error checking friendship status for ${userName}:`, error);
    }
}

/**
 * Hiển thị sheet tùy chọn khi click vào nút Bạn bè
 * @param {Event} e - Sự kiện click
 */
function showFriendOptionsSheet(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const button = e.currentTarget;
    const userId = button.dataset.userId;
    const userName = button.dataset.userName;
    const friendshipId = button.dataset.friendshipId;
    
    // Xóa sheet cũ nếu đã tồn tại
    const existingSheet = document.querySelector('.friend-options-sheet');
    if (existingSheet) {
        existingSheet.remove();
    }
    
    // Tạo sheet tùy chọn
    const sheet = document.createElement('div');
    sheet.className = 'friend-options-sheet animate__animated animate__fadeInUp';
    sheet.innerHTML = `
        <div class="sheet-header">
            <h4>${userName}</h4>
            <button class="close-sheet"><i class="fas fa-times"></i></button>
        </div>
        <div class="sheet-options">
            <button class="sheet-option view-profile">
                <i class="fas fa-user"></i>
                <span>Xem trang cá nhân</span>
            </button>
            <button class="sheet-option unfriend">
                <i class="fas fa-user-minus"></i>
                <span>Huỷ kết bạn</span>
            </button>
            <button class="sheet-option block-user">
                <i class="fas fa-ban"></i>
                <span>Chặn người dùng này</span>
            </button>
        </div>
    `;
    
    // Thêm sheet vào body
    document.body.appendChild(sheet);
    
    // Thêm backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    document.body.appendChild(backdrop);
    
    // Xử lý đóng sheet
    const closeBtn = sheet.querySelector('.close-sheet');
    closeBtn.addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);
    
    // Xử lý các tùy chọn
    const viewProfileBtn = sheet.querySelector('.view-profile');
    viewProfileBtn.addEventListener('click', () => {
        // Chuyển đến trang cá nhân
        window.location.href = `/profile.html?id=${userId}`;
        closeSheet();
    });
    
    const unfriendBtn = sheet.querySelector('.unfriend');
    unfriendBtn.addEventListener('click', async () => {
        try {
            // Hiển thị xác nhận nếu cần
            if (confirm(`Bạn có chắc muốn huỷ kết bạn với ${userName}?`)) {
                // Gọi API huỷ kết bạn
                const response = await apiService.friends.unfriendUser(userId);
                
                if (response.success) {
                    // Cập nhật trạng thái nút trở lại thành "Kết bạn"
                    button.innerHTML = '<i class="fas fa-user-plus"></i><span>Kết bạn</span>';
                    button.classList.remove('is-friend');
                    
                    // Xóa event listener cũ
                    button.removeEventListener('click', showFriendOptionsSheet);
                    
                    // Gán lại event listener để gửi lời mời kết bạn
                    button.addEventListener('click', async function(event) {
                        event.preventDefault();
                        
                        // Kiểm tra đăng nhập
                        if (!localStorage.getItem('aley_token')) {
                            showLoginPrompt('Bạn cần đăng nhập để gửi lời mời kết bạn');
                            return;
                        }
                        
                        // Cập nhật giao diện nút ngay lập tức
                        this.innerHTML = '<i class="fas fa-user-clock"></i><span>Đã gửi</span>';
                        this.classList.add('sent');
                        
                        try {
                            // Gửi lời mời kết bạn
                            const sendResponse = await apiService.friends.sendFriendRequest(userId);
                            if (sendResponse.success && sendResponse.data) {
                                this.dataset.requestId = sendResponse.data.request_id;
                                showToast('success', 'Đã gửi lời mời kết bạn', `Đã gửi lời mời kết bạn đến ${userName}`);
                            }
                        } catch (sendError) {
                            console.error('Error sending friend request:', sendError);
                            // Khôi phục trạng thái nút nếu gặp lỗi
                            this.innerHTML = '<i class="fas fa-user-plus"></i><span>Kết bạn</span>';
                            this.classList.remove('sent');
                            showToast('error', 'Lỗi', 'Không thể gửi lời mời kết bạn. Vui lòng thử lại sau.');
                        }
                    });
                    
                    showToast('success', 'Đã huỷ kết bạn', `Bạn đã huỷ kết bạn với ${userName}`);
                } else {
                    showToast('error', 'Lỗi', response.error?.message || 'Không thể huỷ kết bạn. Vui lòng thử lại sau.');
                }
            }
        } catch (error) {
            console.error('Error unfriending user:', error);
            showToast('error', 'Lỗi', 'Không thể huỷ kết bạn. Vui lòng thử lại sau.');
        }
        closeSheet();
    });
    
    const blockUserBtn = sheet.querySelector('.block-user');
    blockUserBtn.addEventListener('click', () => {
        // Chức năng chặn người dùng (có thể phát triển sau)
        showToast('info', 'Chức năng đang phát triển', 'Tính năng chặn người dùng đang được phát triển');
        closeSheet();
    });
    
    function closeSheet() {
        sheet.classList.remove('animate__fadeInUp');
        sheet.classList.add('animate__fadeOutDown');
        backdrop.classList.add('animate__fadeOut');
        
        setTimeout(() => {
            sheet.remove();
            backdrop.remove();
        }, 300);
    }
    
    // Thêm CSS vào document nếu chưa có
    if (!document.getElementById('friend-options-sheet-styles')) {
        const style = document.createElement('style');
        style.id = 'friend-options-sheet-styles';
        style.textContent = `
            .sheet-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 9998;
            }
            
            .friend-options-sheet {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background-color: white;
                border-radius: 12px 12px 0 0;
                padding: 16px;
                z-index: 9999;
                box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .sheet-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 12px;
                border-bottom: 1px solid #eee;
                margin-bottom: 12px;
            }
            
            .sheet-header h4 {
                margin: 0;
                font-size: 18px;
            }
            
            .close-sheet {
                background: none;
                border: none;
                font-size: 18px;
                color: #777;
                cursor: pointer;
            }
            
            .sheet-options {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .sheet-option {
                display: flex;
                align-items: center;
                gap: 12px;
                background: none;
                border: none;
                padding: 12px;
                text-align: left;
                font-size: 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .sheet-option:hover {
                background-color: #f5f5f5;
            }
            
            .sheet-option i {
                font-size: 18px;
                width: 24px;
                text-align: center;
            }
            
            .unfriend {
                color: #e74c3c;
            }
            
            .block-user {
                color: #e74c3c;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Display a toast notification
 * @param {string} type - The type of toast (success, error)
 * @param {string} title - The toast title
 * @param {string} message - The toast message
 */
function showToast(type, title, message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate__animated animate__fadeInUp`;
    
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add toast to the document
    document.body.appendChild(toast);
    
    // Handle toast close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.add('animate__fadeOutDown');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.add('animate__fadeOutDown');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Display login prompt when trying to perform actions that require login
 * @param {string} message - The message to display
 */
function showLoginPrompt(message) {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'login-prompt-modal animate__animated animate__fadeInDown';
    
    modal.innerHTML = `
        <div class="login-prompt-header">
            <h3>Đăng nhập</h3>
            <button class="close-modal"><i class="fas fa-times"></i></button>
        </div>
        <div class="login-prompt-body">
            <p>${message}</p>
        </div>
        <div class="login-prompt-footer">
            <button class="cancel-btn">Huỷ bỏ</button>
            <button class="login-btn">Đăng nhập ngay</button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    
    // Handle close button
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const loginBtn = modal.querySelector('.login-btn');
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    
    loginBtn.addEventListener('click', () => {
        window.location.href = '../index.html?redirect=' + encodeURIComponent(window.location.href);
    });
    
    function closeModal() {
        modal.classList.remove('animate__fadeInDown');
        modal.classList.add('animate__fadeOutUp');
        
        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.remove();
                backdrop.remove();
            }
        }, 300);
    }
}

// Add to global scope for use in other modules
window.setupFriendRequestButtons = setupFriendRequestButtons;

// Initialize the add friend buttons when a post is created
document.addEventListener('DOMContentLoaded', function() {
    // Initial setup for existing posts
    setupFriendRequestButtons();
    
    // Set up observer to handle buttons in new posts
    const feedElement = document.querySelector('.feed');
    if (feedElement) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    setTimeout(setupFriendRequestButtons, 100);
                }
            });
        });
        
        observer.observe(feedElement, { childList: true, subtree: true });
    }
});

/**
 * Update all friend buttons for the same user
 * @param {string} userId - The user ID to update buttons for
 * @param {string} status - The new status ('sent', 'received', 'is-friend')
 * @param {string} requestId - The request ID (for sent/received)
 * @param {string} friendshipId - The friendship ID (for friends)
 */
function updateAllFriendButtonsForUser(userId, status, requestId = null, friendshipId = null) {
    // Find all add friend buttons for this user
    const allButtons = document.querySelectorAll(`.add-friend-btn[data-user-id="${userId}"]`);
    
    console.log(`Updating ${allButtons.length} buttons for user ${userId} to status: ${status}`);
    
    allButtons.forEach(btn => {
        // Skip the button that triggered the action (it's already updated)
        if (btn.dataset.updating === 'true') return;
        
        // Mark all buttons as not being updated
        delete btn.dataset.updating;
        
        switch (status) {
            case 'sent':
                // Update to "sent" state
                btn.innerHTML = '<i class="fas fa-user-clock"></i><span>Hủy lời mời</span>';
                btn.classList.add('sent');
                btn.classList.remove('is-friend', 'received');
                
                // Store request ID if provided
                if (requestId) {
                    btn.dataset.requestId = requestId;
                }
                break;
                
            case 'received':
                // Update to "received" state
                btn.innerHTML = '<i class="fas fa-user-plus"></i><span>Chấp nhận</span>';
                btn.classList.add('received');
                btn.classList.remove('is-friend', 'sent');
                
                // Store request ID if provided
                if (requestId) {
                    btn.dataset.requestId = requestId;
                }
                break;
                
            case 'is-friend':
                // Update to "friends" state
                btn.innerHTML = '<i class="fas fa-user-check"></i><span>Bạn bè</span>';
                btn.classList.add('is-friend');
                btn.classList.remove('sent', 'received');
                
                // Store friendship ID if provided
                if (friendshipId) {
                    btn.dataset.friendshipId = friendshipId;
                }
                
                // Add event listener for friend options if not already present
                const hasClickHandler = btn.getAttribute('data-has-friend-options') === 'true';
                if (!hasClickHandler) {
                    btn.addEventListener('click', showFriendOptionsSheet);
                    btn.setAttribute('data-has-friend-options', 'true');
                }
                break;
                
            default:
                // Reset to default state
                btn.innerHTML = '<i class="fas fa-user-plus"></i><span>Kết bạn</span>';
                btn.classList.remove('sent', 'received', 'is-friend');
                
                // Remove stored IDs
                delete btn.dataset.requestId;
                delete btn.dataset.friendshipId;
        }
    });
} 