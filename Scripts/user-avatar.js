// User Avatar Manager
// Handles loading and managing user avatars

class UserAvatarManager {
    constructor() {
        this.defaultAvatarUrl = '../assets/images/default-avatar.png';
        this.fallbackAvatarUrl = 'https://i.pravatar.cc/150?img=12';
    }

    // Initialize avatar loading for the page
    initialize() {
        // Load avatar for the post creator
        this.updatePostCreatorAvatar();
    }

    // Update avatar in the post creator
    updatePostCreatorAvatar() {
        const createPostAvatar = document.querySelector('.create-post-card .avatar img');
        if (!createPostAvatar) return;

        // If user is logged in
        if (localStorage.getItem('aley_token')) {
            this.fetchUserAvatar(createPostAvatar);
        }
    }

    // Fetch user avatar from API or localStorage
    async fetchUserAvatar(avatarElement = null) {
        // Check if user is logged in
        if (!localStorage.getItem('aley_token')) return;

        try {
            // Try to get user info from API
            const userData = await AleyAPI.User.getCurrentUser();
            
            // Update avatar if element is provided
            if (avatarElement && userData.avatar) {
                // Xử lý avatar có thể là URL hoặc ID MongoDB
                const avatarUrl = this.getAvatarUrl(userData.avatar);
                
                // Update avatar and remove data-default attribute
                avatarElement.src = avatarUrl;
                avatarElement.removeAttribute('data-default');
                
                // Save avatar to localStorage for faster access in the future
                try {
                    localStorage.setItem('aley_user_avatar', userData.avatar); // Lưu giá trị gốc để xử lý sau
                    localStorage.setItem('aley_user_name', userData.fullName || 'Người dùng Aley');
                    
                    // Save email and user ID for post ownership identification
                    if (userData.email) {
                        localStorage.setItem('aley_user_email', userData.email);
                    }
                    if (userData.user_id || userData.id) {
                        localStorage.setItem('aley_user_id', userData.user_id || userData.id);
                    }
                } catch (e) {
                    console.warn('Cannot save user info to localStorage:', e);
                }
            }

            return userData;
        } catch (error) {
            console.error('Cannot get user info:', error);
            
            // If API fails, try to use saved avatar from localStorage
            if (avatarElement) {
                const savedAvatar = localStorage.getItem('aley_user_avatar');
                if (savedAvatar) {
                    avatarElement.src = this.getAvatarUrl(savedAvatar);
                    avatarElement.removeAttribute('data-default');
                }
            }

            return null;
        }
    }

    // Get user avatar URL (from localStorage or default)
    getUserAvatarUrl() {
        const savedAvatar = localStorage.getItem('aley_user_avatar');
        if (savedAvatar) {
            return this.getAvatarUrl(savedAvatar);
        }
        return this.defaultAvatarUrl;
    }
    
    // Hàm để xử lý avatar có thể là URL hoặc ID MongoDB
    getAvatarUrl(avatar) {
        if (!avatar) {
            return this.fallbackAvatarUrl;
        }
        
        // Kiểm tra nếu avatar là URL (bắt đầu bằng http://, https://, hoặc blob:)
        if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('blob:')) {
            return avatar;
        } else {
            // Nếu không phải URL, giả định đây là image_id và tạo URL đến API
            const apiBaseUrl = AleyAPI ? AleyAPI.baseUrl : 'https://aley-social-media-website-platform.onrender.com ';
            return `${apiBaseUrl}/users/image/${avatar}`;
        }
    }

    // Update all user avatars on the page
    updateAllUserAvatars() {
        // Update post creator avatar
        this.updatePostCreatorAvatar();
        
        // Update avatar in comment sections if they exist
        const commentAvatars = document.querySelectorAll('.comment-input .avatar img');
        commentAvatars.forEach(avatar => {
            avatar.src = this.getUserAvatarUrl();
        });
        
        // If edit post modal is open, update avatar there too
        const editModalAvatar = document.querySelector('.edit-post-modal .avatar img');
        if (editModalAvatar) {
            editModalAvatar.src = this.getUserAvatarUrl();
        }
    }
}

// Create global instance
const userAvatarManager = new UserAvatarManager();

// Export for use in other modules
window.userAvatarManager = userAvatarManager; 