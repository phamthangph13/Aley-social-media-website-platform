/**
 * post-creator.js - Handles functionality for creating posts
 * Includes text input, image/video upload, emoji selection, and check-in
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const postTextarea = document.querySelector('.post-input textarea');
    const imageBtn = document.querySelector('.attachment-btn:nth-child(1)');
    const emojiBtn = document.querySelector('.attachment-btn:nth-child(2)');
    const checkInBtn = document.querySelector('.attachment-btn:nth-child(3)');
    const postBtn = document.querySelector('.post-btn');
    const privacyBtn = document.querySelector('.privacy-btn');
    const privacyDropdown = document.querySelector('.privacy-dropdown');
    const privacyOptions = document.querySelectorAll('.privacy-option');
    
    // State variables
    let postData = {
        content: '',
        attachments: [],
        emotion: null,
        location: null,
        privacy: 'public'
    };
    
    // Create hidden file input for image/video uploads
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*,video/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Create UI containers for previews
    const previewContainer = document.createElement('div');
    previewContainer.className = 'attachments-preview';
    document.querySelector('.post-attachments').insertAdjacentElement('beforebegin', previewContainer);

    const emotionContainer = document.createElement('div');
    emotionContainer.className = 'emotion-display';
    document.querySelector('.post-attachments').insertAdjacentElement('beforebegin', emotionContainer);

    const locationContainer = document.createElement('div');
    locationContainer.className = 'location-display';
    document.querySelector('.post-attachments').insertAdjacentElement('beforebegin', locationContainer);
    
    // Create a div for displaying formatted content with colored hashtags
    const formattedDisplay = document.createElement('div');
    formattedDisplay.className = 'formatted-content';
    formattedDisplay.style.display = 'none'; // Initially hidden
    
    // Insert the formatted display after the textarea
    postTextarea.insertAdjacentElement('afterend', formattedDisplay);
    
    // Initialize privacy selector with default value
    const selectPublicOption = document.querySelector('.privacy-option[data-privacy="public"]');
    if (selectPublicOption) {
        selectPublicOption.classList.add('selected');
    }
    
    // Event Listeners
    postTextarea.addEventListener('input', updatePostContent);
    imageBtn.addEventListener('click', handleImageButtonClick);
    fileInput.addEventListener('change', handleFileSelection);
    emojiBtn.addEventListener('click', handleEmojiButtonClick);
    checkInBtn.addEventListener('click', handleCheckInButtonClick);
    postBtn.addEventListener('click', handlePostSubmission);
    
    // Simple privacy selector toggle
    if (privacyBtn) {
        privacyBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            privacyDropdown.classList.toggle('active');
        };
    }
    
    // Add direct click events to privacy options
    document.querySelectorAll('.privacy-option').forEach(option => {
        option.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Get privacy value from data attribute
            const privacy = this.getAttribute('data-privacy');
            
            // Update postData
            postData.privacy = privacy;
            
            // Update UI
            document.querySelectorAll('.privacy-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            
            // Update button text and icon
            const privacyText = privacyBtn.querySelector('.privacy-text');
            const privacyIcon = privacyBtn.querySelector('i:first-child');
            
            if (privacy === 'public') {
                privacyText.textContent = 'Công khai';
                privacyIcon.className = 'fas fa-globe';
            } else if (privacy === 'friends') {
                privacyText.textContent = 'Bạn bè';
                privacyIcon.className = 'fas fa-user-friends';
            } else if (privacy === 'private') {
                privacyText.textContent = 'Chỉ mình tôi';
                privacyIcon.className = 'fas fa-lock';
            }
            
            // Close dropdown
            privacyDropdown.classList.remove('active');
        };
    });
    
    // Stop propagation inside dropdown
    privacyDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (privacyDropdown.classList.contains('active') && !privacyDropdown.contains(e.target) && !privacyBtn.contains(e.target)) {
            privacyDropdown.classList.remove('active');
        }
    });
    
    // Event Handlers
    function updatePostContent() {
        postData.content = postTextarea.value.trim();
        updateFormattedDisplay();
        validatePostButton();
    }
    
    function handleImageButtonClick() {
        fileInput.click();
    }
    
    function handleFileSelection(e) {
        const files = e.target.files;
        if (!files.length) return;
        
        // Kiểm tra giới hạn tệp
        if (postData.attachments.length + files.length > 10) {
            alert('Bạn chỉ có thể đính kèm tối đa 10 tệp.');
            return;
        }
        
        // Add new files to existing attachments
        Array.from(files).forEach(file => {
            // Kiểm tra kích thước tệp
            const isImage = file.type.startsWith('image/');
            const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB for images, 100MB for videos
            
            if (file.size > maxSize) {
                alert(`Tệp ${file.name} có kích thước quá lớn. Kích thước tối đa: ${isImage ? '10MB' : '100MB'}.`);
                return;
            }
            
            // Kiểm tra định dạng tệp
            const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
            
            if (isImage && !allowedImageTypes.includes(file.type)) {
                alert(`Định dạng ảnh không được hỗ trợ. Các định dạng ảnh hỗ trợ: JPG, JPEG, PNG, GIF, WEBP.`);
                return;
            }
            
            if (!isImage && !allowedVideoTypes.includes(file.type)) {
                alert(`Định dạng video không được hỗ trợ. Các định dạng video hỗ trợ: MP4, WEBM, MOV (QuickTime).`);
                return;
            }
            
            // Add to postData attachments array
            postData.attachments.push(file);
            
            // Create preview for each file
            const preview = document.createElement('div');
            preview.className = 'attachment-preview';
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.addEventListener('load', () => {
                    // Revoke object URL after the image has loaded to free memory
                    URL.revokeObjectURL(img.src);
                });
                preview.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = URL.createObjectURL(file);
                video.controls = true;
                video.addEventListener('loadedmetadata', () => {
                    // Add play button overlay for videos
                    const playButton = document.createElement('div');
                    playButton.className = 'video-play-button';
                    playButton.innerHTML = '<i class="fas fa-play"></i>';
                    preview.appendChild(playButton);
                    
                    // Handle click on play button
                    playButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (video.paused) {
                            video.play();
                            playButton.innerHTML = '<i class="fas fa-pause"></i>';
                        } else {
                            video.pause();
                            playButton.innerHTML = '<i class="fas fa-play"></i>';
                        }
                    });
                    
                    // Revoke object URL after metadata loaded
                    URL.revokeObjectURL(video.src);
                });
                preview.appendChild(video);
            }
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-attachment';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.onclick = function() {
                const index = postData.attachments.indexOf(file);
                if (index > -1) {
                    postData.attachments.splice(index, 1);
                }
                preview.remove();
                
                // Update attachments count display and layout
                updateAttachmentsDisplay();
                validatePostButton();
            };
            
            preview.appendChild(removeBtn);
            previewContainer.appendChild(preview);
        });
        
        // Reset file input so the same files can be selected again if needed
        fileInput.value = '';
        
        // Update attachments count display and layout
        updateAttachmentsDisplay();
        validatePostButton();
    }
    
    // Function to update the attachments display
    function updateAttachmentsDisplay() {
        // Update layout class based on number of attachments
        previewContainer.classList.remove('single-attachment', 'two-attachments');
        if (postData.attachments.length === 1) {
            previewContainer.classList.add('single-attachment');
        } else if (postData.attachments.length === 2) {
            previewContainer.classList.add('two-attachments');
        }
        
        // Update counter
        updateAttachmentsCountDisplay();
    }
    
    // Function to update the attachments count display
    function updateAttachmentsCountDisplay() {
        // Remove existing counter if any
        const existingCounter = document.querySelector('.attachments-count');
        if (existingCounter) {
            existingCounter.remove();
        }
        
        // If we have attachments, show the count
        if (postData.attachments.length > 0) {
            const counterElement = document.createElement('div');
            counterElement.className = 'attachments-count';
            
            // Count images and videos separately
            const imageCount = postData.attachments.filter(file => file.type.startsWith('image/')).length;
            const videoCount = postData.attachments.filter(file => file.type.startsWith('video/')).length;
            
            let countText = '';
            if (imageCount > 0 && videoCount > 0) {
                countText = `${imageCount} ảnh và ${videoCount} video`;
            } else if (imageCount > 0) {
                countText = `${imageCount} ảnh`;
            } else if (videoCount > 0) {
                countText = `${videoCount} video`;
            }
            
            counterElement.innerHTML = `<i class="fas fa-paperclip"></i> ${countText}`;
            
            // Add clear all button if there are multiple attachments
            if (postData.attachments.length > 1) {
                const clearAllBtn = document.createElement('button');
                clearAllBtn.className = 'clear-all-btn';
                clearAllBtn.innerHTML = 'Xóa tất cả';
                clearAllBtn.onclick = function() {
                    postData.attachments = [];
                    previewContainer.innerHTML = '';
                    updateAttachmentsDisplay();
                    validatePostButton();
                };
                counterElement.appendChild(clearAllBtn);
            }
            
            // Insert counter between preview and attachment buttons
            previewContainer.insertAdjacentElement('afterend', counterElement);
        }
    }
    
    // Predefined emotions
    const emotions = [
        { emoji: '😊', name: 'vui vẻ' },
        { emoji: '😍', name: 'yêu thích' },
        { emoji: '😢', name: 'buồn' },
        { emoji: '😠', name: 'tức giận' },
        { emoji: '😮', name: 'ngạc nhiên' },
        { emoji: '😂', name: 'hài hước' },
        { emoji: '😎', name: 'ngầu' },
        { emoji: '🥳', name: 'phấn khích' }
    ];
    
    function handleEmojiButtonClick() {
        // Create or toggle emoji picker
        const existingPicker = document.querySelector('.emoji-picker');
        
        if (existingPicker) {
            existingPicker.remove();
            return;
        }
        
        const emojiPicker = document.createElement('div');
        emojiPicker.className = 'emoji-picker';
        
        emotions.forEach(emotion => {
            const emojiBtn = document.createElement('button');
            emojiBtn.className = 'emoji-option';
            emojiBtn.innerHTML = emotion.emoji;
            emojiBtn.title = emotion.name;
            
            emojiBtn.onclick = function() {
                postData.emotion = emotion;
                updateEmotionDisplay();
                emojiPicker.remove();
            };
            
            emojiPicker.appendChild(emojiBtn);
        });
        
        document.querySelector('.post-attachments').appendChild(emojiPicker);
    }
    
    function updateEmotionDisplay() {
        emotionContainer.innerHTML = '';
        
        if (postData.emotion) {
            emotionContainer.innerHTML = `
                <div class="selected-emotion">
                    <span class="emotion-emoji">${postData.emotion.emoji}</span>
                    <span class="emotion-text">Đang cảm thấy ${postData.emotion.name}</span>
                    <button class="remove-emotion"><i class="fas fa-times"></i></button>
                </div>
            `;
            
            document.querySelector('.remove-emotion').addEventListener('click', function() {
                postData.emotion = null;
                emotionContainer.innerHTML = '';
            });
        }
    }
    
    // Predefined locations
    const popularLocations = [
        'Hà Nội, Việt Nam',
        'Hồ Chí Minh, Việt Nam',
        'Đà Nẵng, Việt Nam',
        'Huế, Việt Nam',
        'Nha Trang, Việt Nam',
        'Đà Lạt, Việt Nam'
    ];
    
    function handleCheckInButtonClick() {
        // Create or toggle location picker
        const existingPicker = document.querySelector('.location-picker');
        
        if (existingPicker) {
            existingPicker.remove();
            return;
        }
        
        const locationPicker = document.createElement('div');
        locationPicker.className = 'location-picker';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Tìm kiếm địa điểm...';
        searchInput.className = 'location-search';
        locationPicker.appendChild(searchInput);
        
        const locationsList = document.createElement('div');
        locationsList.className = 'locations-list';
        
        // Add popular locations
        popularLocations.forEach(location => {
            const locationOption = document.createElement('div');
            locationOption.className = 'location-option';
            locationOption.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${location}`;
            
            locationOption.onclick = function() {
                postData.location = location;
                updateLocationDisplay();
                locationPicker.remove();
            };
            
            locationsList.appendChild(locationOption);
        });
        
        // Add option to use current location
        const currentLocationOption = document.createElement('div');
        currentLocationOption.className = 'location-option current-location';
        currentLocationOption.innerHTML = '<i class="fas fa-crosshairs"></i> Vị trí hiện tại của bạn';
        
        currentLocationOption.onclick = function() {
            if (navigator.geolocation) {
                currentLocationOption.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác định vị trí...';
                
                navigator.geolocation.getCurrentPosition(position => {
                    postData.location = `${position.coords.latitude}, ${position.coords.longitude}`;
                    updateLocationDisplay();
                    locationPicker.remove();
                }, error => {
                    alert('Không thể xác định vị trí của bạn. Vui lòng kiểm tra quyền truy cập.');
                    currentLocationOption.innerHTML = '<i class="fas fa-crosshairs"></i> Vị trí hiện tại của bạn';
                });
            } else {
                alert('Trình duyệt của bạn không hỗ trợ định vị.');
            }
        };
        
        locationsList.appendChild(currentLocationOption);
        locationPicker.appendChild(locationsList);
        
        document.querySelector('.post-attachments').appendChild(locationPicker);
        
        // Filter locations based on search
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredLocations = popularLocations.filter(location => 
                location.toLowerCase().includes(searchTerm)
            );
            
            locationsList.innerHTML = '';
            
            filteredLocations.forEach(location => {
                const locationOption = document.createElement('div');
                locationOption.className = 'location-option';
                locationOption.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${location}`;
                
                locationOption.onclick = function() {
                    postData.location = location;
                    updateLocationDisplay();
                    locationPicker.remove();
                };
                
                locationsList.appendChild(locationOption);
            });
            
            locationsList.appendChild(currentLocationOption);
        });
    }
    
    function updateLocationDisplay() {
        locationContainer.innerHTML = '';
        
        if (postData.location) {
            locationContainer.innerHTML = `
                <div class="selected-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span class="location-text">${postData.location}</span>
                    <button class="remove-location"><i class="fas fa-times"></i></button>
                </div>
            `;
            
            document.querySelector('.remove-location').addEventListener('click', function() {
                postData.location = null;
                locationContainer.innerHTML = '';
            });
        }
    }
    
    function validatePostButton() {
        const hasContent = postData.content !== '';
        const hasAttachments = postData.attachments.length > 0;
        
        // Enable post button if there's content or attachments
        if (hasContent || hasAttachments) {
            postBtn.classList.add('active');
            postBtn.disabled = false;
        } else {
            postBtn.classList.remove('active');
            postBtn.disabled = true;
        }
    }
    
    // Function to create and show loading overlay
    function showLoadingOverlay() {
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        
        // Create spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        loadingOverlay.appendChild(spinner);
        
        // Create loading text
        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Đang đăng bài viết...';
        loadingOverlay.appendChild(loadingText);
        
        // Create progress bar container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'loading-progress-container';
        
        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'loading-progress-bar';
        progressContainer.appendChild(progressBar);
        
        loadingOverlay.appendChild(progressContainer);
        
        // Add loading overlay to post card
        const postCard = document.querySelector('.create-post-card');
        postCard.style.position = 'relative';
        postCard.appendChild(loadingOverlay);
        
        return loadingOverlay;
    }
    
    function handlePostSubmission() {
        // Validate before submission
        if (!postData.content && postData.attachments.length === 0) {
            // Show error or alert
            alert('Vui lòng nhập nội dung hoặc thêm hình ảnh/video.');
            return;
        }
        
        // Show loading overlay
        const loadingOverlay = showLoadingOverlay();
        const progressBar = loadingOverlay.querySelector('.loading-progress-bar');
        const loadingText = loadingOverlay.querySelector('.loading-text');
        
        // Disable post button while submitting
        postBtn.disabled = true;
        postBtn.classList.remove('active');
        
        // Sử dụng API service để đăng bài viết
        apiService.posts.createPost(postData, (percentComplete) => {
            // Cập nhật thanh tiến độ với phần trăm thực tế
            progressBar.style.width = percentComplete + '%';
            progressBar.style.animation = 'none'; // Tắt animation mặc định
            
            // Cập nhật thông báo tiến độ
            if (postData.attachments.length > 0) {
                if (percentComplete < 100) {
                    loadingText.textContent = `Đang tải lên: ${percentComplete}%`;
                } else {
                    loadingText.textContent = 'Đang xử lý bài viết...';
                }
            }
        })
        .then(response => {
            // Xử lý khi đăng thành công
            loadingOverlay.remove();
            
            // Hiển thị thông báo thành công
            const successMessage = document.createElement('div');
            successMessage.className = 'post-success-message';
            successMessage.textContent = response.message || 'Bài viết đã được đăng thành công!';
            document.querySelector('.create-post-card').appendChild(successMessage);
            
            // Thêm bài viết mới vào feed
            appendNewPost(response.data);
            
            // Xóa form sau vài giây
            setTimeout(() => {
                clearPostForm();
                successMessage.remove();
            }, 3000);
        })
        .catch(error => {
            // Xử lý khi có lỗi
            loadingOverlay.remove();
            
            // Hiển thị thông báo lỗi
            const errorMessage = document.createElement('div');
            errorMessage.className = 'post-error-message';
            errorMessage.textContent = error.message || 'Đã xảy ra lỗi khi đăng bài viết';
            document.querySelector('.create-post-card').appendChild(errorMessage);
            
            // Bật lại nút đăng
            validatePostButton();
            
            // Xóa thông báo lỗi sau vài giây
            setTimeout(() => {
                errorMessage.remove();
            }, 5000);
            
            console.error('Error posting:', error);
        });
    }
    
    // Hàm để thêm bài viết mới vào feed
    function appendNewPost(post) {
        const feed = document.querySelector('.feed');
        
        // Tạo HTML cho bài viết
        const postElement = document.createElement('div');
        postElement.className = 'post-card card animate__animated animate__fadeIn';
        
        // Tạo HTML cho phần media
        let mediaHTML = '';
        if (post.media && post.media.length > 0) {
            if (post.media.length === 1) {
                const media = post.media[0];
                if (media.type === 'image') {
                    mediaHTML = `<div class="post-media"><img src="${media.url}" alt=""></div>`;
                } else if (media.type === 'video') {
                    mediaHTML = `<div class="post-media"><video src="${media.url}" controls poster="${media.thumbnail}"></video></div>`;
                }
            } else {
                mediaHTML = '<div class="post-media grid-media">';
                post.media.forEach(media => {
                    if (media.type === 'image') {
                        mediaHTML += `<img src="${media.url}" alt="">`;
                    } else if (media.type === 'video') {
                        mediaHTML += `<div class="video-container">
                            <video src="${media.url}" poster="${media.thumbnail}"></video>
                            <div class="video-play-button"><i class="fas fa-play"></i></div>
                        </div>`;
                    }
                });
                mediaHTML += '</div>';
            }
        }
        
        // Tạo HTML cho phần cảm xúc
        let emotionHTML = '';
        if (post.emotion) {
            emotionHTML = `<span class="post-emotion">- đang cảm thấy ${post.emotion.emoji} ${post.emotion.name}</span>`;
        }
        
        // Tạo HTML cho phần vị trí
        let locationHTML = '';
        if (post.location) {
            locationHTML = `<span class="post-location">tại <i class="fas fa-map-marker-alt"></i> ${post.location}</span>`;
        }
        
        // Định dạng thời gian
        const postDate = new Date(post.created_at);
        const formattedDate = postDate.toLocaleString('vi-VN');
        
        // Tạo HTML cho bài viết
        postElement.innerHTML = `
            <div class="card-header post-header">
                <div class="post-author">
                    <div class="avatar">
                        <img src="${post.author.avatar}" alt="Avatar">
                    </div>
                    <div class="author-info">
                        <h4>${post.author.name}</h4>
                        <p>${formattedDate} ${post.privacy !== 'public' ? `<i class="fas fa-${post.privacy === 'private' ? 'lock' : 'user-friends'}"></i>` : ''}</p>
                    </div>
                </div>
                <div class="post-options">
                    <i class="fas fa-ellipsis-h"></i>
                </div>
            </div>
            <div class="card-body post-content">
                <p>${post.content || ''} ${emotionHTML} ${locationHTML}</p>
                ${mediaHTML}
            </div>
            <div class="card-footer post-footer">
                <div class="post-stats">
                    <div class="likes">
                        <i class="fas fa-heart"></i>
                        <span>${post.likes_count}</span>
                    </div>
                    <div class="comments">
                        <i class="fas fa-comment"></i>
                        <span>${post.comments_count}</span>
                    </div>
                    <div class="shares">
                        <i class="fas fa-share"></i>
                        <span>${post.shares_count}</span>
                    </div>
                </div>
                <div class="post-actions">
                    <button class="action-btn">
                        <i class="far fa-heart"></i>
                        <span>Thích</span>
                    </button>
                    <button class="action-btn">
                        <i class="far fa-comment"></i>
                        <span>Bình luận</span>
                    </button>
                    <button class="action-btn">
                        <i class="far fa-share-square"></i>
                        <span>Chia sẻ</span>
                    </button>
                </div>
            </div>
        `;
        
        // Thêm vào đầu feed
        feed.insertBefore(postElement, feed.firstChild);
        
        // Thêm sự kiện cho nút thích
        setupLikeButton(postElement.querySelector('.action-btn:nth-child(1)'), post.post_id);
    }
    
    // Hàm thiết lập nút thích
    function setupLikeButton(likeButton, postId) {
        likeButton.addEventListener('click', function() {
            this.classList.toggle('liked');
            const icon = this.querySelector('i');
            const likeCountElement = this.closest('.post-footer').querySelector('.likes span');
            let likeCount = parseInt(likeCountElement.textContent);
            
            if (this.classList.contains('liked')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                likeCountElement.textContent = likeCount + 1;
                
                // Hiệu ứng heart bouncing
                icon.classList.add('animate__animated', 'animate__heartBeat');
                setTimeout(() => {
                    icon.classList.remove('animate__animated', 'animate__heartBeat');
                }, 1000);
                
                // Gọi API thích bài viết
                apiService.posts.toggleLike(postId)
                    .catch(error => {
                        console.error('Error liking post:', error);
                        // Khôi phục trạng thái nếu API gọi thất bại
                        this.classList.remove('liked');
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                        likeCountElement.textContent = likeCount;
                    });
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                likeCountElement.textContent = Math.max(0, likeCount - 1);
                
                // Gọi API bỏ thích bài viết
                apiService.posts.toggleLike(postId)
                    .catch(error => {
                        console.error('Error unliking post:', error);
                        // Khôi phục trạng thái nếu API gọi thất bại
                        this.classList.add('liked');
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        likeCountElement.textContent = likeCount;
                    });
            }
        });
    }
    
    function clearPostForm() {
        // Reset form and state
        postTextarea.value = '';
        previewContainer.innerHTML = '';
        emotionContainer.innerHTML = '';
        locationContainer.innerHTML = '';
        
        // Remove attachments counter if it exists
        const attachmentsCounter = document.querySelector('.attachments-count');
        if (attachmentsCounter) {
            attachmentsCounter.remove();
        }
        
        // Reset preview container classes
        previewContainer.classList.remove('single-attachment', 'two-attachments');
        
        // Reset privacy selector to public
        if (privacyBtn) {
            const privacyText = privacyBtn.querySelector('.privacy-text');
            const privacyIcon = privacyBtn.querySelector('i:first-child');
            
            if (privacyText && privacyIcon) {
                privacyText.textContent = 'Công khai';
                privacyIcon.className = 'fas fa-globe';
                
                // Remove selected class from all options
                privacyOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Mark the public option as selected
                const publicOption = document.querySelector('.privacy-option[data-privacy="public"]');
                if (publicOption) {
                    publicOption.classList.add('selected');
                }
            }
        }
        
        postData = {
            content: '',
            attachments: [],
            emotion: null,
            location: null,
            privacy: 'public'
        };
        
        validatePostButton();
    }
    
    // Initialize
    validatePostButton();
    
    // Thiết lập nút thích cho các bài viết hiện có
    document.querySelectorAll('.post-card').forEach(post => {
        const likeButton = post.querySelector('.action-btn:nth-child(1)');
        const postId = post.dataset.postId || '';
        if (likeButton && postId) {
            setupLikeButton(likeButton, postId);
        }
    });
    
    // Function to update the formatted display with colored hashtags
    function updateFormattedDisplay() {
        const text = postTextarea.value;
        
        // If text is empty, hide the formatted display
        if (!text) {
            formattedDisplay.style.display = 'none';
            return;
        }
        
        // Show the formatted display
        formattedDisplay.style.display = 'block';
        
        // Generate formatted HTML with colored hashtags
        const formattedHTML = formatTextWithHashtags(text);
        formattedDisplay.innerHTML = formattedHTML;
    }
    
    // Function to format text with colored hashtags
    function formatTextWithHashtags(text) {
        // Create a temporary div element
        const tempDiv = document.createElement('div');
        
        // HTML encode the text to prevent issues
        const encodedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        // Replace hashtags with colored spans
        // This regex matches hashtags that are:
        // - Preceded by a space or at beginning of text
        // - Include letters, numbers, Vietnamese chars, and underscores
        // - Continue until a space, punctuation, or end of string
        let formattedText = encodedText.replace(/(^|\s)(#[\p{L}\p{N}_]+)/gu, function(match, p1, p2) {
            const color = getHashtagColor(p2);
            return p1 + `<span class="hashtag" style="color: ${color};">${p2}</span>`;
        });
        
        // Convert line breaks to <br>
        formattedText = formattedText.replace(/\n/g, '<br>');
        
        // Add non-hashtag text with normal color
        formattedText = `<span class="normal-text">${formattedText}</span>`;
        
        return formattedText;
    }
    
    // Function to generate a consistent color for each hashtag
    function getHashtagColor(hashtag) {
        // List of vibrant colors for hashtags
        const colors = [
            '#E53935', // Red
            '#8E24AA', // Purple
            '#1E88E5', // Blue
            '#43A047', // Green
            '#FFB300', // Amber
            '#FB8C00', // Orange
            '#00ACC1', // Cyan
            '#3949AB', // Indigo
            '#D81B60', // Pink
            '#00897B'  // Teal
        ];
        
        // Generate a hash code for the hashtag to get a consistent color
        let hashCode = 0;
        for (let i = 0; i < hashtag.length; i++) {
            hashCode = (hashtag.charCodeAt(i) + ((hashCode << 5) - hashCode)) & 0xFFFFFFFF;
        }
        
        // Use modulo to get an index in the colors array
        const colorIndex = Math.abs(hashCode) % colors.length;
        return colors[colorIndex];
    }
    
    // Handle textarea input events for real-time hashtag highlighting
    postTextarea.addEventListener('input', function(e) {
        updatePostContent();
        
        // Position the formatted display to match the textarea
        positionFormattedDisplay();
    });
    
    // Position the formatted display to overlay with the textarea
    function positionFormattedDisplay() {
        // Make the formatted display match the size of the textarea
        formattedDisplay.style.width = postTextarea.clientWidth + 'px';
        formattedDisplay.style.height = postTextarea.clientHeight + 'px';
    }
    
    // When the user focuses on the formatted display, redirect focus to the textarea
    formattedDisplay.addEventListener('click', function() {
        postTextarea.focus();
    });
    
    // Synchronize scrolling between textarea and formatted display
    postTextarea.addEventListener('scroll', function() {
        formattedDisplay.scrollTop = postTextarea.scrollTop;
    });
    
    // Initial position of the formatted display
    window.addEventListener('load', positionFormattedDisplay);
    window.addEventListener('resize', positionFormattedDisplay);
}); 