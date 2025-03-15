/**
 * Profile Posts Handler
 * Handles loading and displaying posts on the profile page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Element references
    const postsGrid = document.querySelector('.posts-grid');
    const postsLoading = document.querySelector('.posts-loading');
    const postsError = document.querySelector('.posts-error');
    const postsEmpty = document.querySelector('.posts-empty');
    const retryBtn = document.querySelector('.retry-btn');
    const createPostBtn = document.querySelector('.create-post-btn');
    const postLoadingOverlay = document.querySelector('.post-loading-overlay');
    const postLoadingProgressBar = document.querySelector('.post-loading-progress-bar');
    
    // Fetch user posts when page loads
    loadUserPosts();
    
    // Retry button event listener
    if (retryBtn) {
        retryBtn.addEventListener('click', function() {
            loadUserPosts();
        });
    }
    
    // Create post button event listener
    if (createPostBtn) {
        createPostBtn.addEventListener('click', function() {
            window.location.href = 'home.html';
        });
    }
    
    // Hiệu ứng cho các nút trong profile
    const actionButtons = document.querySelectorAll('.primary-btn, .secondary-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => {
                this.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
        });
    });

    // Hiệu ứng cho navigation
    const navLinks = document.querySelectorAll('.profile-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Hiệu ứng khi load trang
    const animatedElements = document.querySelectorAll('.animate__animated');
    setTimeout(() => {
        animatedElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }, 300);
    
    // Function to load user posts
    function loadUserPosts() {
        // Show loading state
        postsLoading.style.display = 'flex';
        postsError.style.display = 'none';
        postsEmpty.style.display = 'none';
        postsGrid.innerHTML = '';
        
        // Get user ID from URL if specified
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        
        // If viewing someone else's profile (with userId in URL)
        if (userId) {
            apiService.posts.getUserPosts(userId)
                .then(response => {
                    // Hide loading state
                    postsLoading.style.display = 'none';
                    
                    if (response.data && response.data.posts && response.data.posts.length > 0) {
                        // Display posts
                        response.data.posts.forEach(post => {
                            const postElement = createPostElement(post);
                            postsGrid.appendChild(postElement);
                        });
                    } else {
                        // Show empty state
                        postsEmpty.style.display = 'block';
                    }
                })
                .catch(error => {
                    // Show error state
                    postsLoading.style.display = 'none';
                    postsError.style.display = 'block';
                    
                    // Hiển thị thông báo lỗi cụ thể trong giao diện
                    const errorMessage = document.querySelector('.posts-error p');
                    if (errorMessage) {
                        errorMessage.textContent = error.message || 'Đã xảy ra lỗi khi tải bài viết. Vui lòng thử lại sau.';
                    }
                    
                    // Hiển thị nút tải lại rõ ràng hơn
                    const retryBtn = document.querySelector('.retry-btn');
                    if (retryBtn) {
                        retryBtn.style.display = 'block';
                        retryBtn.textContent = 'Thử lại';
                    }
                });
        } else {
            // If viewing our own profile, use the optimized getMyPosts method
            apiService.posts.getMyPosts()
                .then(response => {
                    // Hide loading state
                    postsLoading.style.display = 'none';
                    
                    if (response.data && response.data.posts && response.data.posts.length > 0) {
                        // Display my posts directly
                        response.data.posts.forEach(post => {
                            const postElement = createPostElement(post);
                            postsGrid.appendChild(postElement);
                        });
                    } else {
                        // Show empty state
                        postsEmpty.style.display = 'block';
                    }
                })
                .catch(error => {
                    // Show error state
                    postsLoading.style.display = 'none';
                    postsError.style.display = 'block';
                    
                    // Hiển thị thông báo lỗi cụ thể trong giao diện
                    const errorMessage = document.querySelector('.posts-error p');
                    if (errorMessage) {
                        errorMessage.textContent = error.message || 'Đã xảy ra lỗi khi tải bài viết. Vui lòng thử lại sau.';
                    }
                    
                    // Hiển thị nút tải lại rõ ràng hơn
                    const retryBtn = document.querySelector('.retry-btn');
                    if (retryBtn) {
                        retryBtn.style.display = 'block';
                        retryBtn.textContent = 'Thử lại';
                    }
                });
        }
    }
    
    // Function to create post element
    function createPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'post-item animate__animated animate__fadeIn';
        postElement.dataset.postId = post.post_id;
        
        // Create media HTML
        let mediaHTML = '';
        if (post.media && post.media.length > 0) {
            const mediaCount = post.media.length;
            
            if (mediaCount === 1) {
                // Single media file
                const media = post.media[0];
                if (media.type === 'image') {
                    mediaHTML = `<div class="post-media"><img src="${media.url}" alt=""></div>`;
                } else if (media.type === 'video') {
                    mediaHTML = `<div class="post-media">
                        <video src="${media.url}" poster="${media.thumbnail}"></video>
                        <div class="video-play-button"><i class="fas fa-play"></i></div>
                    </div>`;
                }
            } else {
                // Multiple media files
                mediaHTML = `<div class="post-media grid-media count-${Math.min(mediaCount, 4)}">`;
                
                // Limit to display max 4 files
                const displayCount = Math.min(mediaCount, 4);
                for (let i = 0; i < displayCount; i++) {
                    const media = post.media[i];
                    if (media.type === 'image') {
                        // If this is the last displayed image and there are more
                        if (i === displayCount - 1 && mediaCount > displayCount) {
                            mediaHTML += `
                                <div class="media-item">
                                    <img src="${media.url}" alt="">
                                    <div class="more-media-overlay">+${mediaCount - displayCount + 1}</div>
                                </div>
                            `;
                        } else {
                            mediaHTML += `<img src="${media.url}" alt="">`;
                        }
                    } else if (media.type === 'video') {
                        // If this is the last displayed video and there are more
                        if (i === displayCount - 1 && mediaCount > displayCount) {
                            mediaHTML += `
                                <div class="video-container">
                                    <video src="${media.url}" poster="${media.thumbnail}"></video>
                                    <div class="video-play-button"><i class="fas fa-play"></i></div>
                                    <div class="more-media-overlay">+${mediaCount - displayCount + 1}</div>
                                </div>
                            `;
                        } else {
                            mediaHTML += `
                                <div class="video-container">
                                    <video src="${media.url}" poster="${media.thumbnail}"></video>
                                    <div class="video-play-button"><i class="fas fa-play"></i></div>
                                </div>
                            `;
                        }
                    }
                }
                mediaHTML += '</div>';
            }
        }
        
        // Format for emotion display
        let emotionHTML = '';
        if (post.emotion) {
            emotionHTML = `<span class="post-emotion">- đang cảm thấy ${post.emotion.emoji} ${post.emotion.name}</span>`;
        }
        
        // Format for location display
        let locationHTML = '';
        if (post.location) {
            locationHTML = `<span class="post-location">tại <i class="fas fa-map-marker-alt"></i> ${post.location}</span>`;
        }
        
        // Format date
        const postDate = new Date(post.created_at);
        const formattedDate = postDate.toLocaleString('vi-VN');
        
        // Create HTML for privacy label
        let privacyLabel = '';
        if (post.privacy === 'private') {
            privacyLabel = '<span class="privacy-label private"><i class="fas fa-lock"></i> Riêng tư</span>';
        } else if (post.privacy === 'friends') {
            privacyLabel = '<span class="privacy-label friends"><i class="fas fa-user-friends"></i> Bạn bè</span>';
        } else {
            privacyLabel = '<span class="privacy-label public"><i class="fas fa-globe-asia"></i> Công khai</span>';
        }
        
        // Format post content with hashtag highlighting
        const formattedContent = window.hashtagFormatter ? 
            window.hashtagFormatter.formatTextWithHashtags(post.content || '') : 
            (post.content || '');
        
        // Create post HTML structure
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <img src="${getAvatarUrl(post.author.avatar)}" alt="Author">
                    <div class="author-info">
                        <h4>${post.author.name}</h4>
                        <span class="post-time">${formattedDate} ${privacyLabel}</span>
                    </div>
                </div>
                <button class="post-menu">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
            <div class="post-content">
                <p>${formattedContent} ${emotionHTML} ${locationHTML}</p>
                ${mediaHTML}
            </div>
            <div class="post-actions">
                <button class="action-btn ${post.is_liked ? 'liked' : ''}">
                    <i class="${post.is_liked ? 'fas' : 'far'} fa-heart"></i>
                    <span>${post.likes_count}</span>
                </button>
                <button class="action-btn">
                    <i class="far fa-comment"></i>
                    <span>${post.comments_count}</span>
                </button>
                <button class="action-btn">
                    <i class="far fa-share"></i>
                    <span>${post.shares_count}</span>
                </button>
            </div>
        `;
        
        // Set up like button functionality
        const likeButton = postElement.querySelector('.action-btn:nth-child(1)');
        setupLikeButton(likeButton, post.post_id);
        
        // Set up video play functionality
        const playButtons = postElement.querySelectorAll('.video-play-button');
        playButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const videoContainer = this.closest('.video-container') || this.closest('.post-media');
                const video = videoContainer.querySelector('video');
                if (video) {
                    if (video.paused) {
                        video.play();
                        this.style.display = 'none';
                    } else {
                        video.pause();
                        this.style.display = 'flex';
                    }
                }
            });
        });
        
        // Set up video event listeners
        const videos = postElement.querySelectorAll('video');
        videos.forEach(video => {
            video.addEventListener('play', function() {
                const playButton = this.parentElement.querySelector('.video-play-button');
                if (playButton) playButton.style.display = 'none';
            });
            
            video.addEventListener('pause', function() {
                const playButton = this.parentElement.querySelector('.video-play-button');
                if (playButton) playButton.style.display = 'flex';
            });
            
            video.addEventListener('ended', function() {
                const playButton = this.parentElement.querySelector('.video-play-button');
                if (playButton) playButton.style.display = 'flex';
            });
        });
        
        return postElement;
    }
    
    // Function to handle like/unlike post
    function setupLikeButton(button, postId) {
        if (!button) return;
        
        button.addEventListener('click', function() {
            this.classList.toggle('liked');
            const icon = this.querySelector('i');
            const countElement = this.querySelector('span');
            let count = parseInt(countElement.textContent);
            
            if (this.classList.contains('liked')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                countElement.textContent = count + 1;
                
                // Animation effect
                icon.classList.add('animate__animated', 'animate__heartBeat');
                setTimeout(() => {
                    icon.classList.remove('animate__animated', 'animate__heartBeat');
                }, 1000);
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                countElement.textContent = Math.max(0, count - 1);
            }
            
            // Call API to toggle like
            if (apiService && apiService.posts) {
                apiService.posts.toggleLike(postId).catch(error => {
                    console.error('Error toggling like:', error);
                    // Revert UI if API call fails
                    this.classList.toggle('liked');
                    if (this.classList.contains('liked')) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        countElement.textContent = count + 1;
                    } else {
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                        countElement.textContent = Math.max(0, count - 1);
                    }
                });
            }
        });
    }
    
    // Function to show loading overlay
    function showLoadingOverlay() {
        if (postLoadingOverlay) {
            postLoadingOverlay.classList.add('active');
            updateProgressBar(0);
        }
    }
    
    // Function to hide loading overlay
    function hideLoadingOverlay() {
        if (postLoadingOverlay) {
            postLoadingOverlay.classList.remove('active');
        }
    }
    
    // Function to update progress bar
    function updateProgressBar(percent) {
        if (postLoadingProgressBar) {
            postLoadingProgressBar.style.width = percent + '%';
        }
    }

    // Hàm để xử lý avatar có thể là URL hoặc ID MongoDB
    function getAvatarUrl(avatar) {
        if (!avatar) {
            return 'https://i.pravatar.cc/150?img=1'; // Avatar mặc định
        }
        
        // Kiểm tra nếu avatar là URL (bắt đầu bằng http://, https://, hoặc blob:)
        if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('blob:')) {
            return avatar;
        } else {
            // Nếu không phải URL, giả định đây là image_id và tạo URL đến API
            return `${apiService.baseUrl || 'https://website-social-media-aley-back-end.onrender.com'}/users/image/${avatar}`;
        }
    }
}); 