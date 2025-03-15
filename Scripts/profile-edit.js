/**
 * Profile Edit Functionality
 * Handles the edit profile sheet/modal and profile information updates
 */

// Initialize the module and attach to window
window.profileEdit = (function() {
    // Private variables
    let currentUserData = null;
    let editSheet = null;
    
    // Debug helper function
    function debugUserData(stage, data) {
        console.group(`PROFILE EDIT DEBUG - ${stage}`);
        console.log('Full data:', data);
        console.log('Bio field:', {
            'profile-bio': data['profile-bio'],
            'Has profile-bio': !!data['profile-bio'],
            'profile-bio type': typeof data['profile-bio']
        });
        console.groupEnd();
    }
    
    // Create the edit profile sheet/modal
    function createEditProfileSheet() {
        // Create the sheet container if it doesn't exist
        if (!document.querySelector('.profile-edit-sheet')) {
            const sheet = document.createElement('div');
            sheet.className = 'profile-edit-sheet';
            sheet.innerHTML = `
                <div class="profile-edit-overlay"></div>
                <div class="profile-edit-container">
                    <div class="profile-edit-header">
                        <h2>Chỉnh sửa hồ sơ</h2>
                        <button class="profile-edit-close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="profile-edit-body">
                        <form id="profile-edit-form">
                            <div class="profile-edit-avatar">
                                <img src="" alt="Avatar" class="edit-avatar-preview">
                                <button type="button" class="change-avatar-btn">
                                    <i class="fas fa-camera"></i>
                                </button>
                            </div>
                            <div class="profile-edit-field">
                                <label for="fullName">Họ và tên</label>
                                <input type="text" id="fullName" name="fullName" placeholder="Họ và tên của bạn">
                            </div>
                            <div class="profile-edit-field">
                                <label for="birthday">Ngày sinh nhật</label>
                                <input type="date" id="birthday" name="birthday">
                            </div>
                            <div class="profile-edit-field">
                                <label for="bio">Giới thiệu</label>
                                <textarea id="bio" name="bio" rows="3" placeholder="Viết một vài điều về bạn..."></textarea>
                            </div>
                            <div class="profile-edit-buttons">
                                <button type="button" class="cancel-edit-btn">Hủy</button>
                                <button type="submit" class="save-profile-btn">Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(sheet);
            editSheet = sheet;
            
            // Add event listeners
            setupEventListeners();
            
            // Add styles
            addStyles();
        }
        
        return document.querySelector('.profile-edit-sheet');
    }
    
    // Add necessary styles for the edit sheet
    function addStyles() {
        if (!document.getElementById('profile-edit-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'profile-edit-styles';
            styleEl.textContent = `
                .profile-edit-sheet {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1000;
                    font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif);
                }
                
                .profile-edit-sheet.active {
                    display: block;
                    animation: fadeIn 0.3s ease-out;
                }
                
                .profile-edit-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                }
                
                .profile-edit-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: var(--bg-primary, #fff);
                    color: var(--text-primary, #333);
                    border-radius: 12px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
                    width: 90%;
                    max-width: 500px;
                    max-height: 85vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s ease-out;
                }
                
                .profile-edit-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-color, #eee);
                }
                
                .profile-edit-header h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0;
                }
                
                .profile-edit-close-btn {
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    color: var(--text-secondary, #777);
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 0.2s;
                }
                
                .profile-edit-close-btn:hover {
                    background-color: var(--bg-hover, #f5f5f5);
                }
                
                .profile-edit-body {
                    padding: 20px;
                }
                
                .profile-edit-avatar {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    margin: 0 auto 20px;
                }
                
                .edit-avatar-preview {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid var(--border-color, #eee);
                }
                
                .change-avatar-btn {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background-color: var(--bg-accent, #4a76a8);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                
                .profile-edit-field {
                    margin-bottom: 16px;
                }
                
                .profile-edit-field label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 8px;
                    color: var(--text-secondary, #666);
                }
                
                .profile-edit-field input,
                .profile-edit-field textarea {
                    width: 100%;
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid var(--border-color, #ddd);
                    background-color: var(--bg-input, #fff);
                    color: var(--text-primary, #333);
                    font-size: 1rem;
                    transition: border-color 0.3s;
                }
                
                .profile-edit-field input:focus,
                .profile-edit-field textarea:focus {
                    outline: none;
                    border-color: var(--color-accent, #4a76a8);
                    box-shadow: 0 0 0 2px rgba(74, 118, 168, 0.2);
                }
                
                .profile-edit-field textarea {
                    resize: vertical;
                    min-height: 80px;
                }
                
                .profile-edit-buttons {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 24px;
                }
                
                .cancel-edit-btn,
                .save-profile-btn {
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .cancel-edit-btn {
                    background-color: var(--bg-button-secondary, #f0f2f5);
                    color: var(--text-primary, #333);
                    border: 1px solid var(--border-color, #ddd);
                }
                
                .save-profile-btn {
                    background-color: var(--bg-accent, #4a76a8);
                    color: white;
                    border: none;
                }
                
                .cancel-edit-btn:hover {
                    background-color: var(--bg-button-secondary-hover, #e4e6eb);
                }
                
                .save-profile-btn:hover {
                    background-color: var(--bg-accent-hover, #3a659d);
                }
                
                /* Loading state */
                .profile-edit-container.loading::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255, 255, 255, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1;
                }
                
                .profile-edit-container.loading::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 30px;
                    height: 30px;
                    border: 3px solid var(--bg-accent, #4a76a8);
                    border-top-color: transparent;
                    border-radius: 50%;
                    z-index: 2;
                    animation: spin 1s linear infinite;
                }
                
                /* Animations */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { transform: translate(-50%, -40%); opacity: 0; }
                    to { transform: translate(-50%, -50%); opacity: 1; }
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Dark mode compatibility */
                [data-theme="dark"] .profile-edit-container {
                    background-color: var(--bg-primary, #242526);
                    color: var(--text-primary, #e4e6eb);
                }
                
                [data-theme="dark"] .profile-edit-field input,
                [data-theme="dark"] .profile-edit-field textarea {
                    background-color: var(--bg-input, #3a3b3c);
                    border-color: var(--border-color, #3a3b3c);
                    color: var(--text-primary, #e4e6eb);
                }
                
                [data-theme="dark"] .profile-edit-close-btn:hover {
                    background-color: var(--bg-hover, #3a3b3c);
                }
                
                [data-theme="dark"] .cancel-edit-btn {
                    background-color: var(--bg-button-secondary, #3a3b3c);
                    color: var(--text-primary, #e4e6eb);
                    border-color: var(--border-color, #4e4f50);
                }
                
                [data-theme="dark"] .cancel-edit-btn:hover {
                    background-color: var(--bg-button-secondary-hover, #4e4f50);
                }
                
                /* Responsive styles */
                @media (max-width: 480px) {
                    .profile-edit-container {
                        width: 95%;
                        max-height: 90vh;
                    }
                    
                    .profile-edit-buttons {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .cancel-edit-btn, 
                    .save-profile-btn {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(styleEl);
        }
    }
    
    // Set up event listeners for the edit sheet
    function setupEventListeners() {
        if (!editSheet) return;
        
        // Close button
        const closeBtn = editSheet.querySelector('.profile-edit-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideEditSheet);
        }
        
        // Click on overlay
        const overlay = editSheet.querySelector('.profile-edit-overlay');
        if (overlay) {
            overlay.addEventListener('click', hideEditSheet);
        }
        
        // Cancel button
        const cancelBtn = editSheet.querySelector('.cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', hideEditSheet);
        }
        
        // Change avatar button
        const changeAvatarBtn = editSheet.querySelector('.change-avatar-btn');
        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', function() {
                // Create a file input element
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                
                // Trigger click on file input
                fileInput.click();
                
                // Handle file selection
                fileInput.addEventListener('change', function() {
                    if (fileInput.files && fileInput.files[0]) {
                        // Preview the selected image
                        const avatarPreview = editSheet.querySelector('.edit-avatar-preview');
                        if (avatarPreview) {
                            avatarPreview.src = URL.createObjectURL(fileInput.files[0]);
                        }
                        
                        // Store the file for upload when form is submitted
                        window.selectedAvatarFile = fileInput.files[0];
                    }
                    
                    // Clean up
                    document.body.removeChild(fileInput);
                });
            });
        }
        
        // Add background/cover photo selection
        // First, check if the form in the edit sheet has a background field, if not, add it
        if (!editSheet.querySelector('.profile-edit-background')) {
            const formBody = editSheet.querySelector('.profile-edit-body form');
            if (formBody) {
                // Create the background field and add it before the bio field
                const bioField = editSheet.querySelector('.profile-edit-field:last-of-type');
                
                const backgroundField = document.createElement('div');
                backgroundField.className = 'profile-edit-field profile-edit-background';
                backgroundField.innerHTML = `
                    <label>Ảnh bìa</label>
                    <div class="background-preview-container">
                        <img src="" alt="Ảnh bìa" class="background-preview">
                        <button type="button" class="change-background-btn">
                            <i class="fas fa-camera"></i> Thay đổi ảnh bìa
                        </button>
                    </div>
                `;
                
                // Insert the background field before the bio field
                if (bioField) {
                    formBody.insertBefore(backgroundField, bioField);
                } else {
                    formBody.appendChild(backgroundField);
                }
                
                // Add styles for the background preview
                if (!document.getElementById('background-preview-styles')) {
                    const styleEl = document.createElement('style');
                    styleEl.id = 'background-preview-styles';
                    styleEl.textContent = `
                        .background-preview-container {
                            position: relative;
                            width: 100%;
                            height: 120px;
                            margin-bottom: 16px;
                            overflow: hidden;
                            border-radius: 8px;
                            border: 1px solid var(--border-color, #ddd);
                        }
                        
                        .background-preview {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }
                        
                        .change-background-btn {
                            position: absolute;
                            bottom: 8px;
                            right: 8px;
                            background-color: rgba(0, 0, 0, 0.6);
                            color: white;
                            border: none;
                            border-radius: 4px;
                            padding: 6px 12px;
                            font-size: 0.85rem;
                            cursor: pointer;
                            transition: background-color 0.2s;
                        }
                        
                        .change-background-btn:hover {
                            background-color: rgba(0, 0, 0, 0.8);
                        }
                    `;
                    document.head.appendChild(styleEl);
                }
            }
        }
        
        // Change background/cover photo button
        const changeBackgroundBtn = editSheet.querySelector('.change-background-btn');
        if (changeBackgroundBtn) {
            changeBackgroundBtn.addEventListener('click', function() {
                // Create a file input element
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                
                // Trigger click on file input
                fileInput.click();
                
                // Handle file selection
                fileInput.addEventListener('change', function() {
                    if (fileInput.files && fileInput.files[0]) {
                        // Preview the selected image
                        const backgroundPreview = editSheet.querySelector('.background-preview');
                        if (backgroundPreview) {
                            backgroundPreview.src = URL.createObjectURL(fileInput.files[0]);
                        }
                        
                        // Store the file for upload when form is submitted
                        window.selectedBackgroundFile = fileInput.files[0];
                    }
                    
                    // Clean up
                    document.body.removeChild(fileInput);
                });
            });
        }
        
        // Form submission
        const form = editSheet.querySelector('#profile-edit-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                saveProfileChanges();
            });
        }
    }
    
    // Show the edit profile sheet and populate it with current user data
    function showEditSheet(userData) {
        currentUserData = userData || {};
        
        // Debug the incoming user data
        debugUserData('BEFORE EDIT - Incoming User Data', currentUserData);
        
        // Create sheet if it doesn't exist
        const sheet = createEditProfileSheet();
        
        // Populate form with current data
        populateEditForm(currentUserData);
        
        // Show the sheet
        sheet.classList.add('active');
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
    }
    
    // Hide the edit profile sheet
    function hideEditSheet() {
        const sheet = document.querySelector('.profile-edit-sheet');
        if (sheet) {
            sheet.classList.remove('active');
            
            // Restore body scrolling
            document.body.style.overflow = '';
            
            // Clear selected files
            window.selectedAvatarFile = null;
            window.selectedBackgroundFile = null;
        }
    }
    
    // Populate the edit form with user data
    function populateEditForm(userData) {
        if (!editSheet) return;
        
        console.log('Populating form with user data:', userData);
        console.log('Bio data present in userData:', {
            'profile-bio': userData['profile-bio']
        });
        
        // Set avatar
        const avatarPreview = editSheet.querySelector('.edit-avatar-preview');
        if (avatarPreview) {
            const defaultAvatar = 'https://i.pravatar.cc/150?img=1';
            if (userData.avatar) {
                // Kiểm tra nếu avatar là URL
                if (userData.avatar.startsWith('http://') || userData.avatar.startsWith('https://') || userData.avatar.startsWith('blob:')) {
                    avatarPreview.src = userData.avatar;
                } else {
                    // Nếu không phải URL, giả định đây là image_id và tạo URL đến API
                    avatarPreview.src = `${AleyAPI.baseUrl}/users/image/${userData.avatar}`;
                }
            } else {
                avatarPreview.src = defaultAvatar;
            }
        }
        
        // Set background/cover photo
        const backgroundPreview = editSheet.querySelector('.background-preview');
        if (backgroundPreview) {
            const defaultCover = 'https://marketplace.canva.com/EAF3xGNlNSc/2/0/1600w/canva-xanh-l%C3%A1-v%C3%A0ng-phong-c%E1%BA%A3nh-c%C3%A2u-l%E1%BA%A1c-b%E1%BB%99-du-l%E1%BB%8Bch-%E1%BA%A3nh-b%C3%ACa-nh%C3%B3m-facebook-DqKwLtooIqU.jpg';
            if (userData.background) {
                // Kiểm tra nếu background là URL
                if (userData.background.startsWith('http://') || userData.background.startsWith('https://') || userData.background.startsWith('blob:')) {
                    backgroundPreview.src = userData.background;
                } else {
                    // Nếu không phải URL, giả định đây là image_id và tạo URL đến API
                    backgroundPreview.src = `${AleyAPI.baseUrl}/users/image/${userData.background}`;
                }
            } else {
                backgroundPreview.src = defaultCover;
            }
        }
        
        // Set full name
        const fullNameInput = editSheet.querySelector('#fullName');
        if (fullNameInput) {
            fullNameInput.value = userData.fullName || '';
        }
        
        // Set birthday - check both possible field names
        const birthdayInput = editSheet.querySelector('#birthday');
        if (birthdayInput) {
            const birthdayValue = userData.dateOfBirth || userData.birthday || '';
            console.log('Setting birthday input value:', birthdayValue);
            birthdayInput.value = birthdayValue;
        }
        
        // Set bio - chỉ dùng trường profile-bio
        const bioInput = editSheet.querySelector('#bio');
        if (bioInput) {
            const bioValue = userData['profile-bio'] || '';
            console.log('Setting bio input value:', bioValue);
            bioInput.value = bioValue;
        }
    }
    
    // Save profile changes
    function saveProfileChanges() {
        if (!editSheet) return;
        
        // Show loading state
        const container = editSheet.querySelector('.profile-edit-container');
        if (container) {
            container.classList.add('loading');
        }
        
        // Get form data
        const fullName = editSheet.querySelector('#fullName').value;
        const birthday = editSheet.querySelector('#birthday').value;
        const bio = editSheet.querySelector('#bio').value;
        
        // Log the form values for debugging
        console.log('Form values:', {
            fullName,
            birthday,
            bio
        });
        
        // Create update object with field names matching the API
        const updateData = {
            fullName: fullName,
            dateOfBirth: birthday || undefined, // Only send if value exists
            'profile-bio': bio // Chỉ dùng định dạng profile-bio
        };
        
        // Also keep the birthday field for our local UI updates
        updateData.birthday = updateData.dateOfBirth;
        
        // Debug the update data
        debugUserData('SAVING - Update Data Before API Call', updateData);
        
        console.log('Preparing update data for API:', updateData);
        
        // Create a promise array for async operations
        const promises = [];
        
        // If we have a new avatar, convert it to base64
        if (window.selectedAvatarFile) {
            const avatarPromise = new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(window.selectedAvatarFile);
                reader.onload = () => {
                    updateData.avatar = reader.result; // This will be base64 encoded
                    resolve();
                };
                reader.onerror = reject;
            });
            promises.push(avatarPromise);
        }
        
        // If we have a new background (cover photo), convert it to base64
        if (window.selectedBackgroundFile) {
            const backgroundPromise = new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(window.selectedBackgroundFile);
                reader.onload = () => {
                    updateData.background = reader.result; // This will be base64 encoded
                    resolve();
                };
                reader.onerror = reject;
            });
            promises.push(backgroundPromise);
        }
        
        // After all file conversions are complete, send the API request
        Promise.all(promises)
            .then(() => {
                console.log('Sending update data to API:', updateData);
                return AleyAPI.User.updateProfile(updateData);
            })
            .then(response => {
                console.log('Profile update response:', response);
                
                // Debug response data
                if (response && response.data && response.data.user) {
                    debugUserData('AFTER API - Response User Data', response.data.user);
                    
                    // Cập nhật updateData với dữ liệu mới từ phản hồi API
                    if (response.data.user.avatar) {
                        updateData.avatar = response.data.user.avatar;
                    }
                    if (response.data.user.background) {
                        updateData.background = response.data.user.background;
                    }
                }
                
                // Remove loading state
                if (container) {
                    container.classList.remove('loading');
                }
                
                // Update the profile UI with new data
                updateProfileUI(updateData);
                
                // Hide the edit sheet
                hideEditSheet();
                
                // Show success message
                showSuccessMessage('Thông tin hồ sơ đã được cập nhật thành công');
                
                // Reset the file selections
                window.selectedAvatarFile = null;
                window.selectedBackgroundFile = null;
                
                // If we have a profile-handler.js that should reload user data, call it
                if (window.profileHandler && typeof window.profileHandler.loadUserData === 'function') {
                    window.profileHandler.loadUserData();
                }
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                
                // Remove loading state
                if (container) {
                    container.classList.remove('loading');
                }
                
                // Show error message
                showErrorMessage('Không thể cập nhật hồ sơ. Vui lòng thử lại sau.');
            });
    }
    
    // Show error message
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
            
            // Add click event to close button
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.classList.remove('active');
            });
            
            // Add styles for error notification if not already added
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
        }
        
        // Set message and show notification
        notification.querySelector('.notification-message').textContent = message;
        notification.classList.add('active');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('active');
        }, 5000);
    }
    
    // Show success message
    function showSuccessMessage(message) {
        const successToast = document.createElement('div');
        successToast.className = 'success-toast animate__animated animate__fadeIn';
        successToast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        // Add styles if not already present
        if (!document.getElementById('toast-styles')) {
            const toastStyles = document.createElement('style');
            toastStyles.id = 'toast-styles';
            toastStyles.textContent = `
                .success-toast {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: var(--color-success, #4caf50);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 1100;
                }
                
                .success-toast i {
                    font-size: 1.25rem;
                }
            `;
            document.head.appendChild(toastStyles);
        }
        
        document.body.appendChild(successToast);
        
        // Remove after a few seconds
        setTimeout(() => {
            successToast.classList.add('animate__fadeOut');
            setTimeout(() => {
                if (document.body.contains(successToast)) {
                    document.body.removeChild(successToast);
                }
            }, 1000);
        }, 3000);
    }
    
    // Update the profile UI with the new data
    function updateProfileUI(updateData) {
        console.log('Updating profile UI with data:', updateData);
        
        // Update profile name
        const profileNameElement = document.querySelector('.profile-name h1');
        if (profileNameElement && updateData.fullName) {
            profileNameElement.textContent = updateData.fullName;
        }
        
        // Update profile bio
        const bioElement = document.querySelector('.profile-bio');
        if (bioElement) {
            const bioText = updateData['profile-bio'] || '';
            if (bioText) {
                bioElement.textContent = bioText;
            }
        }
        
        // Update birthday data - handle both field names
        const birthdayElement = document.querySelector('.profile-birthday');
        if (birthdayElement) {
            const birthdayValue = updateData.dateOfBirth || updateData.birthday || '';
            if (birthdayValue) {
                birthdayElement.setAttribute('data-birthday', birthdayValue);
            }
        }
        
        // Update avatar if provided
        if (updateData.avatar) {
            const avatarImages = document.querySelectorAll('.profile-avatar img, .post-author img');
            avatarImages.forEach(img => {
                // Kiểm tra nếu avatar là URL
                if (typeof updateData.avatar === 'string') {
                    if (updateData.avatar.startsWith('http://') || updateData.avatar.startsWith('https://') || updateData.avatar.startsWith('blob:')) {
                        img.src = updateData.avatar;
                    } else {
                        // Nếu không phải URL, giả định đây là image_id và tạo URL đến API
                        img.src = `${AleyAPI.baseUrl}/users/image/${updateData.avatar}`;
                    }
                }
            });
        }
        
        // Update background if provided
        if (updateData.background) {
            const backgroundImage = document.querySelector('.profile-cover img');
            if (backgroundImage) {
                // Kiểm tra nếu background là URL
                if (typeof updateData.background === 'string') {
                    if (updateData.background.startsWith('http://') || updateData.background.startsWith('https://') || updateData.background.startsWith('blob:')) {
                        backgroundImage.src = updateData.background;
                    } else {
                        // Nếu không phải URL, giả định đây là image_id và tạo URL đến API
                        backgroundImage.src = `${AleyAPI.baseUrl}/users/image/${updateData.background}`;
                    }
                }
            }
        }
    }
    
    // Public API
    return {
        init: function(userData) {
            // Create the edit sheet on initialization
            createEditProfileSheet();
            
            // Store user data
            currentUserData = userData || {};
        },
        showEditSheet: showEditSheet
    };
})();

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get user data (will be populated later when available)
    let userData = {};
    
    // Initialize profile edit
    window.profileEdit.init(userData);
    
    // Debug log
    console.log('Profile Edit Module initialized:', window.profileEdit);
}); 