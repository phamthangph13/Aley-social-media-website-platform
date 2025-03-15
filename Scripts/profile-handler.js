/**
 * Profile Handler
 * Fetches and displays user profile data using the Aley API
 */

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if we're viewing our own profile or someone else's
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        
        let userData;
        
        if (userId) {
            // If userId is provided in URL, fetch that specific user's profile
            userData = await AleyAPI.User.getUserById(userId);
            // Hide edit profile button if viewing someone else's profile
            const editProfileBtn = document.querySelector('.primary-btn');
            if (editProfileBtn) {
                editProfileBtn.style.display = 'none';
            }
        } else {
            // Otherwise fetch current user's profile (requires authentication)
            userData = await AleyAPI.User.getCurrentUser();
        }
        
        // DEBUG: Log ALL user data fields to inspect what the API actually returns
        console.log('FULL API RESPONSE USER DATA:', userData);
        console.log('Object keys in response:', Object.keys(userData));
        console.log('Profile bio:', {
            'profile-bio type': typeof userData['profile-bio'],
            'profile-bio value': userData['profile-bio']
        });
        
        // Store the original user data in a global variable to use later
        window.originalUserData = userData;
        
        // Update profile UI with fetched data
        updateProfileUI(userData);
        
    } catch (error) {
        console.error('Failed to load profile data:', error);
        showErrorMessage('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
    }
});

/**
 * Updates the profile UI with user data
 * @param {Object} userData - The user data object from API
 */
function updateProfileUI(userData) {
    console.log('Raw userData from API:', userData);
    
    // Update profile name and verified status
    const profileNameElement = document.querySelector('.profile-name h1');
    if (profileNameElement) {
        profileNameElement.textContent = userData.fullName || 'Người dùng Aley';
    }
    
    // Update verified badge visibility
    const verifiedBadge = document.querySelector('.verified-badge');
    if (verifiedBadge) {
        verifiedBadge.style.display = userData.verifiedTick ? 'inline-flex' : 'none';
    }
    
    // Update profile avatar
    const avatarImages = document.querySelectorAll('.profile-avatar img, .post-author img');
    const defaultAvatar = 'https://i.pravatar.cc/150?img=1'; // Default fallback avatar
    avatarImages.forEach(img => {
        if (userData.avatar) {
            // Kiểm tra nếu avatar là URL (bắt đầu bằng http://, https://, hoặc blob:)
            if (userData.avatar.startsWith('http://') || userData.avatar.startsWith('https://') || userData.avatar.startsWith('blob:')) {
                img.src = userData.avatar;
            } else {
                // Nếu không phải URL, giả định đây là image_id và tạo URL đến API
                img.src = `${AleyAPI.baseUrl}/users/image/${userData.avatar}`;
            }
        } else {
            img.src = defaultAvatar;
        }
        img.alt = `${userData.fullName}'s avatar`;
    });
    
    // Update profile cover/background image
    const coverImage = document.querySelector('.profile-cover img');
    const defaultCover = 'https://marketplace.canva.com/EAF3xGNlNSc/2/0/1600w/canva-xanh-l%C3%A1-v%C3%A0ng-phong-c%E1%BA%A3nh-c%C3%A2u-l%E1%BA%A1c-b%E1%BB%99-du-l%E1%BB%8Bch-%E1%BA%A3nh-b%C3%ACa-nh%C3%B3m-facebook-DqKwLtooIqU.jpg';
    if (coverImage) {
        if (userData.background) {
            // Kiểm tra nếu background là URL
            if (userData.background.startsWith('http://') || userData.background.startsWith('https://') || userData.background.startsWith('blob:')) {
                coverImage.src = userData.background;
            } else {
                // Nếu không phải URL, giả định đây là image_id và tạo URL đến API
                coverImage.src = `${AleyAPI.baseUrl}/users/image/${userData.background}`;
            }
        } else {
            coverImage.src = defaultCover;
        }
        coverImage.alt = `${userData.fullName}'s cover photo`;
    }
    
    // Update the author name in posts if it exists
    const postAuthorNames = document.querySelectorAll('.author-info h4');
    postAuthorNames.forEach(name => {
        name.textContent = userData.fullName || 'Người dùng Aley';
    });
    
    const bioElement = document.querySelector('.profile-bio');
    if (bioElement) {
        console.log('Bio data in user object:', {
            'profile-bio': userData['profile-bio']
        });
        
        // Chỉ sử dụng profile-bio, không dùng profileBio nữa
        const bioText = userData['profile-bio'] || '';
        
        // Chỉ hiển thị "Chưa có thông tin giới thiệu" khi không có dữ liệu bio
        bioElement.textContent = bioText || 'Chưa có thông tin giới thiệu';
    }
    
    // Update birthday data - handle both dateOfBirth and birthday fields from API
    const birthdayElement = document.querySelector('.profile-birthday');
    if (birthdayElement) {
        // Check both possible field names from API
        const birthdayValue = userData.dateOfBirth || userData.birthday || '1990-01-01';
        console.log('Setting birthday value in DOM:', birthdayValue);
        // Store birthday in data attribute
        birthdayElement.setAttribute('data-birthday', birthdayValue);
    }
}

/**
 * Shows an error message to the user
 * @param {string} message - The error message to display
 */
function showErrorMessage(message) {
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.backgroundColor = '#f8d7da';
    errorDiv.style.color = '#721c24';
    errorDiv.style.padding = '12px';
    errorDiv.style.marginBottom = '15px';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.textAlign = 'center';
    errorDiv.textContent = message;
    
    // Insert at the top of the profile content
    const profileContent = document.querySelector('.profile-content');
    if (profileContent) {
        profileContent.prepend(errorDiv);
    } else {
        // Fallback to add to body if profile content is not found
        document.body.prepend(errorDiv);
    }
    
    // Remove the message after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Add event listener for edit profile button
document.addEventListener('DOMContentLoaded', function() {
    const editProfileBtn = document.querySelector('.primary-btn');
    
    // Debug log for profile edit
    console.log('Profile Handler initialized, profileEdit object:', window.profileEdit);
    
    if (editProfileBtn) {
        console.log('Edit profile button found:', editProfileBtn);
        
        editProfileBtn.addEventListener('click', function() {
            console.log('Edit profile button clicked');
            
            // Use the profile edit sheet instead of the alert
            if (window.profileEdit) {
                console.log('profileEdit object found, showing edit sheet');
                
                // Dùng dữ liệu gốc từ API thay vì lấy từ giao diện HTML
                if (window.originalUserData) {
                    console.log('Using original API data for edit form:', window.originalUserData);
                    window.profileEdit.showEditSheet(window.originalUserData);
                } else {
                    // Fallback to using DOM elements if originalUserData is not available
                    const birthdate = document.querySelector('.profile-birthday')?.getAttribute('data-birthday') || '';
                    const profileBio = document.querySelector('.profile-bio')?.textContent || '';
                    // Đảm bảo không lấy text "Chưa có thông tin giới thiệu" làm giá trị bio
                    const bio = profileBio === 'Chưa có thông tin giới thiệu' ? '' : profileBio;
                    
                    const userData = {
                        fullName: document.querySelector('.profile-name h1')?.textContent || '',
                        avatar: document.querySelector('.profile-avatar img')?.src || '',
                        'profile-bio': bio,
                        birthday: birthdate,
                        dateOfBirth: birthdate
                    };
                    
                    console.log('User data for edit (from DOM):', userData);
                    window.profileEdit.showEditSheet(userData);
                }
            } else {
                console.error('profileEdit object not found!');
                alert('Chức năng chỉnh sửa hồ sơ đang được phát triển');
            }
        });
    } else {
        console.error('Edit profile button not found!');
    }
    
    // Add event listeners for cover photo and avatar update buttons
    const editCoverBtn = document.querySelector('.edit-cover-btn');
    if (editCoverBtn) {
        editCoverBtn.addEventListener('click', function() {
            handleImageUpload('background');
        });
    }
    
    const editAvatarBtn = document.querySelector('.edit-avatar-btn');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', function() {
            handleImageUpload('avatar');
        });
    }
});

/**
 * Handles image upload for avatar or background
 * @param {string} type - Either 'avatar' or 'background'
 */
function handleImageUpload(type) {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Trigger click on the file input
    fileInput.click();
    
    // Handle file selection
    fileInput.addEventListener('change', async function() {
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            
            // Show loading indicator
            const loadingOverlay = document.querySelector('.post-loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
                document.querySelector('.post-loading-text').textContent = 
                    `Đang tải lên ${type === 'avatar' ? 'ảnh đại diện' : 'ảnh bìa'}...`;
            }
            
            try {
                // Convert the file to base64
                const base64Image = await convertFileToBase64(file);
                
                // Update UI temporarily with local object URL
                const imageUrl = URL.createObjectURL(file);
                if (type === 'avatar') {
                    const avatarImages = document.querySelectorAll('.profile-avatar img');
                    avatarImages.forEach(img => img.src = imageUrl);
                } else if (type === 'background') {
                    const coverImage = document.querySelector('.profile-cover img');
                    if (coverImage) coverImage.src = imageUrl;
                }
                
                // Prepare data for API
                const updateData = {};
                updateData[type] = base64Image;
                
                // Call API to update the profile
                const response = await AleyAPI.User.updateProfile(updateData);
                console.log('Profile update response:', response);
                
                // Sau khi cập nhật thành công, lấy dữ liệu mới từ API để có ID ảnh mới
                const updatedUserData = type === 'avatar' 
                    ? { ...window.originalUserData, avatar: getImageSource(response, type) }
                    : { ...window.originalUserData, background: getImageSource(response, type) };
                
                // Cập nhật dữ liệu gốc
                window.originalUserData = updatedUserData;
                
                // Cập nhật giao diện với dữ liệu mới
                updateProfileUI(updatedUserData);
                
                // Show success message
                showSuccessMessage(`Cập nhật ${type === 'avatar' ? 'ảnh đại diện' : 'ảnh bìa'} thành công`);
                
            } catch (error) {
                console.error('Error updating profile image:', error);
                showErrorMessage(`Không thể cập nhật ${type === 'avatar' ? 'ảnh đại diện' : 'ảnh bìa'}. Vui lòng thử lại sau.`);
            } finally {
                // Hide loading indicator
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                
                // Clean up
                document.body.removeChild(fileInput);
            }
        }
    });
}

/**
 * Converts a file to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Promise resolving to base64 string
 */
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

/**
 * Shows a success message
 * @param {string} message - The message to display
 */
function showSuccessMessage(message) {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.profile-notification.success');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'profile-notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span class="notification-message"></span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(notification);
        
        // Add styles for success notification
        if (!document.getElementById('notification-success-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'notification-success-styles';
            styleEl.textContent = `
                .profile-notification.success {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background-color: #d4edda;
                    color: #155724;
                    border-left: 4px solid #28a745;
                    padding: 16px 20px;
                    border-radius: 6px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 320px;
                    max-width: 450px;
                    transform: translateY(100px);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    z-index: 9999;
                }
                
                .profile-notification.success.active {
                    transform: translateY(0);
                    opacity: 1;
                    visibility: visible;
                }
                
                .profile-notification.success .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .profile-notification.success .notification-content i {
                    font-size: 20px;
                }
                
                .profile-notification.success .notification-close {
                    background: none;
                    border: none;
                    color: #155724;
                    cursor: pointer;
                    font-size: 16px;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                
                .profile-notification.success .notification-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(styleEl);
        }
        
        // Add click event to close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('active');
        });
    }
    
    // Set message and show notification
    notification.querySelector('.notification-message').textContent = message;
    notification.classList.add('active');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('active');
    }, 5000);
}

/**
 * Shows an error message
 * @param {string} message - The message to display
 */
function showErrorMessage(message) {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.profile-notification.error');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'profile-notification error';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-circle"></i>
                <span class="notification-message"></span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(notification);
        
        // Add styles for error notification
        if (!document.getElementById('notification-error-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'notification-error-styles';
            styleEl.textContent = `
                .profile-notification.error {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background-color: #f8d7da;
                    color: #721c24;
                    border-left: 4px solid #dc3545;
                    padding: 16px 20px;
                    border-radius: 6px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 320px;
                    max-width: 450px;
                    transform: translateY(100px);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    z-index: 9999;
                }
                
                .profile-notification.error.active {
                    transform: translateY(0);
                    opacity: 1;
                    visibility: visible;
                }
                
                .profile-notification.error .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .profile-notification.error .notification-content i {
                    font-size: 20px;
                }
                
                .profile-notification.error .notification-close {
                    background: none;
                    border: none;
                    color: #721c24;
                    cursor: pointer;
                    font-size: 16px;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                
                .profile-notification.error .notification-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(styleEl);
        }
        
        // Add click event to close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('active');
        });
    }
    
    // Set message and show notification
    notification.querySelector('.notification-message').textContent = message;
    notification.classList.add('active');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('active');
    }, 5000);
}

/**
 * Phân tích response từ API để lấy nguồn ảnh (có thể là URL hoặc ID)
 * @param {Object} response - Phản hồi từ API 
 * @param {string} type - Loại ảnh (avatar hoặc background)
 * @returns {string} - Nguồn ảnh (URL hoặc ID)
 */
function getImageSource(response, type) {
    // Kiểm tra nếu response chứa dữ liệu người dùng
    if (response && response.data && response.data.user) {
        const user = response.data.user;
        return user[type]; // Trả về giá trị của type tương ứng (avatar hoặc background)
    }
    
    // Nếu không tìm thấy trong response, giữ nguyên giá trị hiện tại
    return window.originalUserData ? window.originalUserData[type] : null;
}

// Add a method to reload user data (this will be called by profile-edit.js after saving changes)
window.profileHandler = {
    loadUserData: async function() {
        try {
            // Check if we're viewing our own profile or someone else's
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('userId');
            
            let userData;
            
            if (userId) {
                // If userId is provided in URL, fetch that specific user's profile
                userData = await AleyAPI.User.getUserById(userId);
            } else {
                // Otherwise fetch current user's profile (requires authentication)
                userData = await AleyAPI.User.getCurrentUser();
            }
            
            // Update profile UI with fetched data
            updateProfileUI(userData);
            
        } catch (error) {
            console.error('Failed to reload profile data:', error);
            showErrorMessage('Không thể tải lại thông tin hồ sơ. Vui lòng thử lại sau.');
        }
    }
}; 