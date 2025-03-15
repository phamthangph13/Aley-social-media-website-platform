/**
 * Sidebar User Data Handler
 * Fetches current user data and updates the sidebar with user information
 */

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Fetch current user data
        const userData = await fetchCurrentUser();
        
        // Update sidebar user profile area
        updateSidebarUserProfile(userData);
        
    } catch (error) {
        console.error('Failed to load user data for sidebar:', error);
        // Don't show an error message in the sidebar to avoid disrupting the UI
    }
});

/**
 * Fetches the current user's data from the API
 * @returns {Promise<Object>} The user data object
 */
async function fetchCurrentUser() {
    try {
        // Get the auth token from local storage
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Make API request to get current user
        const response = await fetch('https://website-social-media-aley-back-end.onrender.com/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching current user data:', error);
        throw error;
    }
}

/**
 * Updates the sidebar user profile with fetched data
 * @param {Object} userData - The user data from the API
 */
function updateSidebarUserProfile(userData) {
    // Update avatar
    const avatarElement = document.querySelector('.sidebar .user-profile .avatar img');
    if (avatarElement && userData.avatar) {
        avatarElement.src = userData.avatar;
        avatarElement.alt = `${userData.fullName}'s avatar`;
    }
    
    // Update user name
    const nameElement = document.querySelector('.sidebar .user-profile .user-info h4');
    if (nameElement) {
        nameElement.textContent = userData.fullName || 'Người dùng Aley';
    }
    
    // Update username/email
    const usernameElement = document.querySelector('.sidebar .user-profile .user-info p');
    if (usernameElement) {
        // Using email as the username
        const email = userData.email || '';
        usernameElement.textContent = email;
    }
} 