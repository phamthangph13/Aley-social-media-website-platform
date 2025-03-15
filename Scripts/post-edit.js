/**
 * Post Edit Functionality
 * Handles edit modal, edit operations and related UI interactions
 */

// Apply necessary CSS for the special elements notice
const styleElement = document.createElement('style');
styleElement.textContent = `
    .special-elements-notice {
        padding: 10px;
        margin-top: 15px;
        background-color: rgba(var(--primary-color-rgb, 59, 130, 246), 0.1);
        border-radius: 8px;
        font-size: 0.9rem;
        color: var(--text-color, #333);
        border-left: 3px solid var(--primary-color, #3b82f6);
    }
    
    .special-elements-container {
        margin-top: 15px;
        border-top: 1px solid var(--border-color, #eee);
        padding-top: 15px;
    }
    
    .special-elements-title {
        font-weight: bold;
        margin-bottom: 10px;
        font-size: 0.9rem;
        color: var(--text-color, #333);
    }
    
    .edit-emotion-container, .edit-location-container {
        margin-bottom: 10px;
        display: flex;
        align-items: center;
    }
    
    .edit-emotion-container span, .edit-location-container span {
        margin-right: 5px;
        font-size: 0.9rem;
    }
    
    .edit-media-container {
        margin-top: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .edit-media-container img {
        max-width: 100%;
        max-height: 200px;
        border-radius: 8px;
        object-fit: cover;
    }
    
    .edit-media-container video {
        max-width: 100%;
        max-height: 200px;
        border-radius: 8px;
    }
    
    /* Make hashtags visible in the edited content */
    .hashtag {
        font-weight: 600 !important;
        border-radius: 4px !important;
        padding: 0 2px !important;
        margin: 0 -2px !important;
        display: inline-block !important;
        position: relative !important;
        animation: hashtag-pulse 2s ease-in-out infinite !important;
        color: var(--primary-color, #3b82f6) !important;
    }
    
    /* Dark theme support for special notice */
    html[data-theme="dark"] .special-elements-notice {
        background-color: rgba(var(--primary-color-rgb, 59, 130, 246), 0.15);
        color: var(--text-color, #e5e7eb);
    }
    
    html[data-theme="dark"] .special-elements-title {
        color: var(--text-color, #e5e7eb);
    }
    
    html[data-theme="dark"] .edit-emotion-container span, 
    html[data-theme="dark"] .edit-location-container span {
        color: var(--text-muted, #9ca3af);
    }
    
    html[data-theme="dark"] .special-elements-container {
        border-top-color: var(--border-color, #374151);
    }
`;
document.head.appendChild(styleElement);

// Post Edit Functionality
// Handles editing of posts as a bottom sheet

class PostEditManager {
    constructor() {
        this.editModal = document.querySelector('.edit-post-modal');
        this.modalOverlay = document.querySelector('.modal-overlay');
        this.closeModalBtn = document.querySelector('.close-edit-modal');
        this.saveEditBtn = document.querySelector('.save-edit-btn');
        this.editPostContent = document.querySelector('#edit-post-content');
        this.currentPostId = null;
        this.startY = 0;
        this.currentY = 0;
        this.isDragging = false;
        
        this.initEventListeners();
    }

    // Initialize event listeners
    initEventListeners() {
        // Close modal when clicking the close button
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.hideEditModal());
        }
        
        // Close modal when clicking outside (on overlay)
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay) {
                    this.hideEditModal();
                }
            });
        }
        
        // Save edit button click handler
        if (this.saveEditBtn) {
            this.saveEditBtn.addEventListener('click', () => this.savePostEdit());
        }
        
        // Add swipe down to close functionality
        if (this.editModal) {
            // Add touch events for mobile
            this.editModal.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            this.editModal.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            this.editModal.addEventListener('touchend', (e) => this.handleTouchEnd(e));
            
            // Add mouse events for desktop (optional)
            this.editModal.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        }
        
        // Privacy options in edit modal
        const privacyBtn = this.editModal?.querySelector('.privacy-btn');
        const privacyDropdown = this.editModal?.querySelector('.privacy-dropdown');
        const privacyOptions = this.editModal?.querySelectorAll('.privacy-option');
        
        if (privacyBtn && privacyDropdown) {
            // Toggle privacy dropdown
            privacyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                privacyDropdown.classList.toggle('show');
            });
            
            // Handle privacy option selection
            if (privacyOptions?.length) {
                privacyOptions.forEach(option => {
                    option.addEventListener('click', () => {
                        const privacy = option.dataset.privacy;
                        const privacyText = option.querySelector('.privacy-name').textContent;
                        const privacyIconClass = option.querySelector('i').className;
                        
                        // Update button text and icon
                        privacyBtn.querySelector('.privacy-text').textContent = privacyText;
                        privacyBtn.querySelector('i:first-child').className = privacyIconClass;
                        
                        // Store privacy value (for API)
                        this.editModal.dataset.privacy = privacy;
                        
                        // Close dropdown
                        privacyDropdown.classList.remove('show');
                    });
                });
            }
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (privacyDropdown.classList.contains('show') && 
                    !e.target.closest('.privacy-selector')) {
                    privacyDropdown.classList.remove('show');
                }
            });
        }
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalVisible()) {
                this.hideEditModal();
            }
        });
    }

    // Touch event handlers
    handleTouchStart(e) {
        if (e.target.closest('.edit-post-header') || e.target.closest('.edit-post-container::before')) {
            this.startY = e.touches[0].clientY;
            this.isDragging = true;
        }
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;
        
        this.currentY = e.touches[0].clientY;
        const diffY = this.currentY - this.startY;
        
        // Only allow dragging downward
        if (diffY > 0) {
            e.preventDefault();
            this.editModal.style.transform = `translateY(${diffY}px)`;
            
            // Adjust opacity of overlay based on drag distance
            const opacity = Math.max(0.6 - (diffY / 500), 0);
            this.modalOverlay.style.opacity = opacity;
        }
    }

    handleTouchEnd(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        const diffY = this.currentY - this.startY;
        
        // If dragged more than 100px down, close the modal
        if (diffY > 100) {
            this.hideEditModal();
        } else {
            // Otherwise, snap back to original position
            this.editModal.style.transform = '';
            this.modalOverlay.style.opacity = '';
        }
    }

    // Mouse event handlers (for desktop)
    handleMouseDown(e) {
        // Only allow dragging from the header or pull indicator
        if (e.target.closest('.edit-post-header') || e.target.closest('.edit-post-container::before')) {
            this.startY = e.clientY;
            this.isDragging = true;
            e.preventDefault(); // Prevent text selection
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        this.currentY = e.clientY;
        const diffY = this.currentY - this.startY;
        
        // Only allow dragging downward
        if (diffY > 0) {
            this.editModal.style.transform = `translateY(${diffY}px)`;
            
            // Adjust opacity of overlay based on drag distance
            const opacity = Math.max(0.6 - (diffY / 500), 0);
            this.modalOverlay.style.opacity = opacity;
        }
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        const diffY = this.currentY - this.startY;
        
        // If dragged more than 100px down, close the modal
        if (diffY > 100) {
            this.hideEditModal();
        } else {
            // Otherwise, snap back to original position
            this.editModal.style.transform = '';
            this.modalOverlay.style.opacity = '';
        }
    }

    // Show edit modal with post data
    showEditModal(post) {
        if (!this.editModal || !this.modalOverlay || !post) return;
        
        // Reset any transforms from previous interactions
        this.editModal.style.transform = 'translateY(100%)';
        
        // Set current post ID
        this.currentPostId = post.post_id;
        
        // Set content in textarea
        if (this.editPostContent) {
            this.editPostContent.value = post.content || '';
        } else {
            this.editPostContent = document.querySelector('#edit-post-content');
            if (this.editPostContent) {
                this.editPostContent.value = post.content || '';
            }
        }
        
        // Đảm bảo luôn xóa container đặc biệt để tránh hiển thị phần tử từ bài viết trước
        let specialElementsContainer = this.editModal.querySelector('.special-elements-container');
        if (specialElementsContainer) {
            specialElementsContainer.remove();
        }
        
        // Kiểm tra lại nếu có phần tử media, cảm xúc hoặc vị trí thực sự
        // Xác định có nội dung hợp lệ bằng cách kiểm tra HTML - chỉ chấp nhận giá trị defined
        const mediaHTML = post.mediaHTML || '';
        const emotionHTML = post.emotionHTML || '';
        const locationHTML = post.locationHTML || '';
        
        const hasValidMedia = post.hasMedia === true && mediaHTML && mediaHTML.length > 10 && 
            (mediaHTML.includes('<img') || mediaHTML.includes('<video'));
        const hasValidEmotion = post.hasEmotion === true && emotionHTML && emotionHTML.includes('post-emotion');
        const hasValidLocation = post.hasLocation === true && locationHTML && locationHTML.includes('post-location');
        
        // Ghi log để debug
        console.log('Post ID:', post.post_id);
        console.log('Has media:', hasValidMedia, 'Media HTML:', post.hasMedia ? mediaHTML?.substring(0, 50) + '...' : 'None');
        console.log('Has emotion:', hasValidEmotion, 'Emotion HTML:', post.hasEmotion ? emotionHTML?.substring(0, 50) + '...' : 'None');
        console.log('Has location:', hasValidLocation, 'Location HTML:', post.hasLocation ? locationHTML?.substring(0, 50) + '...' : 'None');
        
        // Chỉ hiển thị phần tử đặc biệt khi thực sự có nội dung hợp lệ
        if (hasValidMedia || hasValidEmotion || hasValidLocation) {
            // Create or get the container for special elements
            const noticeContainer = this.editModal.querySelector('.edit-post-body');
            
            // Create a new container for special elements
            specialElementsContainer = document.createElement('div');
            specialElementsContainer.className = 'special-elements-container';
            
            // Add a title for the container
            const title = document.createElement('div');
            title.className = 'special-elements-title';
            title.textContent = 'Phần tử đính kèm bài viết:';
            
            specialElementsContainer.appendChild(title);
            
            // Add emotion element if it exists
            if (hasValidEmotion) {
                const emotionContainer = document.createElement('div');
                emotionContainer.className = 'edit-emotion-container';
                
                const emotionLabel = document.createElement('span');
                emotionLabel.textContent = 'Cảm xúc: ';
                
                emotionContainer.appendChild(emotionLabel);
                
                // Add the emotion element
                const emotionWrapper = document.createElement('div');
                emotionWrapper.style.display = 'inline-block';
                emotionWrapper.innerHTML = emotionHTML;
                
                emotionContainer.appendChild(emotionWrapper);
                specialElementsContainer.appendChild(emotionContainer);
            }
            
            // Add location element if it exists
            if (hasValidLocation) {
                const locationContainer = document.createElement('div');
                locationContainer.className = 'edit-location-container';
                
                const locationLabel = document.createElement('span');
                locationLabel.textContent = 'Địa điểm: ';
                
                locationContainer.appendChild(locationLabel);
                
                // Add the location element
                const locationWrapper = document.createElement('div');
                locationWrapper.style.display = 'inline-block';
                locationWrapper.innerHTML = locationHTML;
                
                locationContainer.appendChild(locationWrapper);
                specialElementsContainer.appendChild(locationContainer);
            }
            
            // Add media elements if they exist
            if (hasValidMedia) {
                const mediaContainer = document.createElement('div');
                mediaContainer.className = 'edit-media-container';
                
                // Set the media HTML
                mediaContainer.innerHTML = mediaHTML;
                
                // Ensure videos have controls
                const videos = mediaContainer.querySelectorAll('video');
                if (videos.length > 0) {
                    videos.forEach(video => {
                        video.controls = true;
                    });
                }
                
                specialElementsContainer.appendChild(mediaContainer);
            }
            
            // Add info message about these elements being preserved
            const infoMessage = document.createElement('div');
            infoMessage.className = 'special-elements-notice';
            infoMessage.textContent = 'Các phần tử trên sẽ được giữ nguyên khi bạn lưu bài viết.';
            
            specialElementsContainer.appendChild(infoMessage);
            
            // Add the special elements container to the modal
            if (noticeContainer) {
                // Find the post-attachments section to insert after
                const attachmentsSection = noticeContainer.querySelector('.post-attachments');
                if (attachmentsSection) {
                    noticeContainer.insertBefore(specialElementsContainer, attachmentsSection.nextSibling);
                } else {
                    // Fallback: add at the end of the container
                    noticeContainer.appendChild(specialElementsContainer);
                }
            }
        }
        
        // Set privacy settings
        const privacyText = this.editModal.querySelector('.privacy-text');
        const privacyIcon = this.editModal.querySelector('.privacy-btn i:first-child');
        
        if (privacyText && privacyIcon) {
            // Default to public
            let privacyName = 'Công khai';
            let iconClass = 'fas fa-globe';
            
            // Set based on post privacy
            if (post.privacy === 'friends') {
                privacyName = 'Bạn bè';
                iconClass = 'fas fa-user-friends';
            } else if (post.privacy === 'private') {
                privacyName = 'Chỉ mình tôi';
                iconClass = 'fas fa-lock';
            }
            
            privacyText.textContent = privacyName;
            privacyIcon.className = iconClass;
            this.editModal.dataset.privacy = post.privacy || 'public';
        }
        
        // Update avatar
        const avatarImg = this.editModal.querySelector('.avatar img');
        if (avatarImg) {
            const userAvatar = localStorage.getItem('aley_user_avatar') || 
                               (post.author && post.author.avatar) || 
                               '../assets/images/default-avatar.png';
                               
            avatarImg.src = userAvatar;
        }
        
        // Make sure display is set before we try to animate
        this.modalOverlay.style.display = 'block';
        this.editModal.style.display = 'block';
        
        // Force a reflow to ensure the transition will work
        void this.editModal.offsetWidth;
        
        // Then trigger the transitions
        this.modalOverlay.classList.add('active');
        this.editModal.classList.add('active');
        this.editModal.style.transform = 'translateY(0)';
        
        // Focus on content textarea
        if (this.editPostContent) {
            setTimeout(() => {
                this.editPostContent.focus();
                
                // Place cursor at the end of the text
                const textLength = this.editPostContent.value.length;
                this.editPostContent.setSelectionRange(textLength, textLength);
            }, 300); // Wait for animation to complete
        }
    }

    // Hide edit modal
    hideEditModal() {
        if (!this.editModal || !this.modalOverlay) return;
        
        // Start the closing animation
        this.editModal.style.transform = 'translateY(100%)';
        this.modalOverlay.classList.remove('active');
        
        // Xóa container chứa các phần tử đặc biệt ngay lập tức
        let specialElementsContainer = this.editModal.querySelector('.special-elements-container');
        if (specialElementsContainer) {
            specialElementsContainer.remove();
        }
        
        // Wait for animation to complete before hiding elements
        setTimeout(() => {
            this.editModal.classList.remove('active');
            this.editModal.style.display = 'none';
            this.modalOverlay.style.display = 'none';
            
            // Reset the transform to default
            this.editModal.style.transform = '';
            
            // Reset current post ID
            this.currentPostId = null;
            
            // Xóa nội dung textarea để tránh lưu từ bài viết trước
            if (this.editPostContent) {
                this.editPostContent.value = '';
            }
            
            // Đặt lại các thuộc tính dataset
            this.editModal.dataset.privacy = 'public';
            
            console.log('Đã đóng và làm sạch modal chỉnh sửa');
        }, 300);
    }

    // Check if modal is visible
    isModalVisible() {
        return this.editModal && this.editModal.classList.contains('active');
    }

    // Save post edit
    savePostEdit() {
        if (!this.currentPostId || !this.editPostContent) return;
        
        const newContent = this.editPostContent.value.trim();
        if (!newContent) {
            alert('Vui lòng nhập nội dung bài viết!');
            return;
        }
        
        // Get selected privacy
        const privacy = this.editModal.dataset.privacy || 'public';
        
        // Find post element in DOM
        const postElement = document.querySelector(`.post-card[data-post-id="${this.currentPostId}"]`);
        if (!postElement) {
            this.hideEditModal();
            return;
        }
        
        // Update post content in UI
        const contentElement = postElement.querySelector('.post-content p');
        if (contentElement) {
            // Format content with hashtags
            let formattedContent = newContent;
            
            // Apply hashtag formatting if available
            if (window.hashtagFormatter) {
                // First pass to format hashtags properly
                formattedContent = window.hashtagFormatter.formatTextWithHashtags(newContent);
            }
            
            // Keep emotion and location parts if they exist
            const emotionElement = contentElement.querySelector('.post-emotion');
            const locationElement = contentElement.querySelector('.post-location');
            
            // Save emotion and location HTML if they exist and have valid content
            const hasValidEmotion = emotionElement && emotionElement.outerHTML.trim().length > 0;
            const hasValidLocation = locationElement && locationElement.outerHTML.trim().length > 0;
            
            const emotionHTML = hasValidEmotion ? emotionElement.outerHTML : '';
            const locationHTML = hasValidLocation ? locationElement.outerHTML : '';
            
            // Combine formatted content with emotion and location
            // Make sure to add spaces only when elements exist
            const emotionPart = emotionHTML ? ' ' + emotionHTML : '';
            const locationPart = locationHTML ? ' ' + locationHTML : '';
            
            // Set the formatted content with preserved elements
            contentElement.innerHTML = formattedContent + emotionPart + locationPart;
            
            // Ensure hashtags have proper styling - force apply styles
            Array.from(contentElement.querySelectorAll('.hashtag')).forEach(hashtag => {
                hashtag.style.fontWeight = '600';
                hashtag.style.borderRadius = '4px';
                hashtag.style.padding = '0 2px';
                hashtag.style.margin = '0 -2px';
                hashtag.style.display = 'inline-block';
                hashtag.style.position = 'relative';
                hashtag.style.animation = 'hashtag-pulse 2s ease-in-out infinite';
                hashtag.style.color = 'var(--primary-color, #3b82f6)';
            });
        }
        
        // Preserve media elements if they exist
        const mediaContainer = postElement.querySelector('.post-media');
        if (mediaContainer) {
            // Make sure media elements stay visible - can be hidden during edit process
            mediaContainer.style.display = 'block';
            
            // Refresh media display to ensure proper styling
            const mediaItems = mediaContainer.querySelectorAll('img, video');
            mediaItems.forEach(mediaItem => {
                // Force a reflow to refresh rendering
                void mediaItem.offsetWidth;
                
                // Ensure proper display
                if (mediaItem.tagName.toLowerCase() === 'img') {
                    mediaItem.style.maxWidth = '100%';
                    mediaItem.style.borderRadius = '8px';
                    mediaItem.style.marginTop = '10px';
                } else if (mediaItem.tagName.toLowerCase() === 'video') {
                    mediaItem.style.maxWidth = '100%';
                    mediaItem.style.borderRadius = '8px';
                    mediaItem.style.marginTop = '10px';
                    mediaItem.controls = true;
                }
            });
        }
        
        // Update privacy icon if needed
        const dateElement = postElement.querySelector('.post-author .author-info p');
        if (dateElement) {
            // Get the date part
            const dateText = dateElement.childNodes[0].nodeValue;
            
            // Add appropriate privacy icon
            if (privacy === 'private') {
                dateElement.innerHTML = dateText + ' <i class="fas fa-lock"></i>';
            } else if (privacy === 'friends') {
                dateElement.innerHTML = dateText + ' <i class="fas fa-user-friends"></i>';
            } else {
                dateElement.innerHTML = dateText;
            }
        }
        
        // In real application, call API to update post
        // apiService.posts.updatePost(this.currentPostId, { content: newContent, privacy })
        //     .then(response => {
        //         console.log('Post updated successfully:', response);
        //     })
        //     .catch(error => {
        //         console.error('Error updating post:', error);
        //         alert('Không thể cập nhật bài viết. Vui lòng thử lại sau.');
        //     });
        
        // Show success feedback
        this.showSuccessToast('Bài viết đã được cập nhật');
        
        // Hide modal
        this.hideEditModal();
    }
    
    // Show a toast notification
    showSuccessToast(message) {
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
        toast.className = 'toast success-toast';
        toast.textContent = message;
        
        // Style the toast
        toast.style.backgroundColor = 'var(--primary-color, #3b82f6)';
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
}

// Create global instance
const postEditManager = new PostEditManager();

// Expose the showEditModal function globally
window.showEditPostModal = (post) => {
    postEditManager.showEditModal(post);
};

// Khởi tạo các sự kiện khi document sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    // Các thiết lập cơ bản khi trang tải xong
}); 