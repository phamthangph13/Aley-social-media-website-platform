// Tạo bộ nhớ tạm cho mock API ngay khi file được tải
(function initializeMockApiDb() {
    // Khởi tạo sớm để đảm bảo tồn tại trước khi các API được gọi
    if (!window.apiServiceMockDb) {
        console.log('Initializing API mock database early');
        window.apiServiceMockDb = {
            friendRequests: {},
            friendships: {},
            requestCounter: 1000
        };
        
        // Lưu xuống localStorage để duy trì giữa các lần làm mới trang
        try {
            const savedDb = localStorage.getItem('apiServiceMockDb');
            if (savedDb) {
                const parsedDb = JSON.parse(savedDb);
                window.apiServiceMockDb = parsedDb;
                console.log('Restored mock DB from localStorage:', window.apiServiceMockDb);
            }
            
            // Thiết lập sự kiện để lưu mock DB trước khi tải lại trang
            window.addEventListener('beforeunload', function() {
                localStorage.setItem('apiServiceMockDb', JSON.stringify(window.apiServiceMockDb));
                console.log('Saved mock DB to localStorage');
            });
        } catch (e) {
            console.warn('Could not use localStorage for mock DB persistence:', e);
        }
    }
})();

/**
 * Aley API Service
 * Provides methods to interact with the Aley backend API
 */

const AleyAPI = {
    // Base URL for API calls - force HTTPS
    baseUrl: 'https://aley-social-media-website-platform.onrender.com',
    
    // Utility methods
    _handleResponse: async function(response) {
        const data = await response.json();
        
        if (!response.ok) {
            // Check for token expiration (401 Unauthorized)
            if (response.status === 401) {
                console.log('Token expired or invalid. Logging out...');
                // Clear the token from local storage
                localStorage.removeItem('aley_token');
                localStorage.removeItem('aley_user_avatar');
                localStorage.removeItem('aley_user_name');
                
                // Show brief notification to user
                this._showExpiredTokenNotification();
                
                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            }
            
            throw new Error(data.message || 'Something went wrong');
        }
        
        // Không cần xử lý đặc biệt cho trường bio - chỉ dùng profile-bio
        console.log('API response data:', data);
        
        return data;
    },
    
    _showExpiredTokenNotification: function() {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '0';
        notification.style.left = '0';
        notification.style.width = '100%';
        notification.style.padding = '15px';
        notification.style.backgroundColor = '#f8d7da';
        notification.style.color = '#721c24';
        notification.style.textAlign = 'center';
        notification.style.zIndex = '9999';
        notification.textContent = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại...';
        document.body.prepend(notification);
    },
    
    _getAuthHeader: function() {
        const token = localStorage.getItem('aley_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },
    
    // Helper to ensure secure URLs and handle API path issues
    _getSecureUrl: function(path, includeApiPrefix = false) {
        // Start with the baseUrl, ensure it's HTTPS
        let secureBaseUrl = this.baseUrl;
        if (secureBaseUrl.startsWith('http://')) {
            secureBaseUrl = secureBaseUrl.replace('http://', 'https://');
            console.warn('Forced HTTPS in baseUrl');
        }
        
        // Add /api/ prefix if requested
        const apiPrefix = includeApiPrefix ? '/api' : '';
        
        // Ensure path starts with / but doesn't duplicate if baseUrl ends with /
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        
        return `${secureBaseUrl}${apiPrefix}${cleanPath}`;
    },
    
    // Authentication methods
    Auth: {
        // Check if user is logged in
        isLoggedIn: function() {
            return !!localStorage.getItem('aley_token');
        },
        
        // Register a new user
        register: async function(userData) {
            try {
                // Try without /api/ prefix first
                const registerUrl = AleyAPI._getSecureUrl('/auth/register');
                console.log('Attempting registration with URL:', registerUrl);
                
                const response = await fetch(registerUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                return AleyAPI._handleResponse(response);
            } catch (error) {
                console.error('Registration failed, trying with /api/ prefix', error);
                
                // Try with /api/ prefix as fallback
                const alternateUrl = AleyAPI._getSecureUrl('/auth/register', true);
                console.log('Alternate registration URL:', alternateUrl);
                
                const response = await fetch(alternateUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                return AleyAPI._handleResponse(response);
            }
        },
        
        // Login user
        login: async function(email, password) {
            try {
                // Try without /api/ prefix first
                const loginUrl = AleyAPI._getSecureUrl('/auth/login');
                console.log('Attempting login with URL:', loginUrl);
                
                const response = await fetch(loginUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await AleyAPI._handleResponse(response);
                
                // Save token to localStorage
                if (data.token) {
                    localStorage.setItem('aley_token', data.token);
                }
                
                return data;
            } catch (error) {
                console.error('Login failed, trying with /api/ prefix', error);
                
                // Try with /api/ prefix as fallback
                const alternateUrl = AleyAPI._getSecureUrl('/auth/login', true);
                console.log('Alternate login URL:', alternateUrl);
                
                const response = await fetch(alternateUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await AleyAPI._handleResponse(response);
                
                // Save token to localStorage
                if (data.token) {
                    localStorage.setItem('aley_token', data.token);
                }
                
                return data;
            }
        },
        
        // Logout user
        logout: function() {
            localStorage.removeItem('aley_token');
            // Redirect to login page
            window.location.href = '../index.html';
        },
        
        // Verify email
        verifyEmail: async function(token) {
            const response = await fetch(`${AleyAPI.baseUrl}/auth/verify/${token}`, {
                method: 'GET'
            });
            
            return AleyAPI._handleResponse(response);
        },
        
        // Forgot password - request reset link
        forgotPassword: async function(email) {
            const response = await fetch(`${AleyAPI.baseUrl}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            return AleyAPI._handleResponse(response);
        },
        
        // Reset password with token
        resetPassword: async function(token, newPassword) {
            const response = await fetch(`${AleyAPI.baseUrl}/auth/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: newPassword })
            });
            
            return AleyAPI._handleResponse(response);
        }
    },
    
    // User methods
    User: {
        // Get current user info
        getCurrentUser: async function() {
            const response = await fetch(`${AleyAPI.baseUrl}/users/me`, {
                method: 'GET',
                headers: {
                    ...AleyAPI._getAuthHeader(),
                    'Content-Type': 'application/json'
                }
            });
            
            return AleyAPI._handleResponse(response);
        },
        
        // Get user by ID
        getUserById: async function(userId) {
            const response = await fetch(`${AleyAPI.baseUrl}/users/${userId}`, {
                method: 'GET'
            });
            
            return AleyAPI._handleResponse(response);
        },
        
        // Update user profile
        updateProfile: async function(userData) {
            // Clone userData object to avoid modifying the original object
            const updateData = { ...userData };
            
            // Đảm bảo chỉ dùng profile-bio, xóa trường profileBio nếu có
            if ('profileBio' in updateData) {
                delete updateData.profileBio;
            }
            
            console.log('Sending update data to server:', updateData);
            
            const response = await fetch(`${AleyAPI.baseUrl}/users/update`, {
                method: 'PUT',
                headers: {
                    ...AleyAPI._getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            return AleyAPI._handleResponse(response);
        },
        
        // Search users
        searchUsers: async function(query, page = 1, limit = 10) {
            const response = await fetch(`${AleyAPI.baseUrl}/users/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    ...AleyAPI._getAuthHeader()
                }
            });
            
            return AleyAPI._handleResponse(response);
        },
        
        // List users (with pagination)
        listUsers: async function(page = 1, limit = 10) {
            const response = await fetch(`${AleyAPI.baseUrl}/users/list?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    ...AleyAPI._getAuthHeader()
                }
            });
            
            return AleyAPI._handleResponse(response);
        }
    }
};

/**
 * Module quản lý các chức năng liên quan đến bài viết
 */
const postService = {
    // Sử dụng baseUrl từ AleyAPI nếu tồn tại, ngược lại sử dụng mặc định
    baseUrl: (typeof AleyAPI !== 'undefined') ? AleyAPI.baseUrl : 'https://aley-social-media-website-platform.onrender.com ',
    
    /**
     * Utility function to handle API response and check for token expiration
     * @param {Response} response - The fetch API response
     * @returns {Promise} - Resolved with data or rejected with error
     */
    _handleApiResponse: function(response) {
        // Check for token expiration
        if (response.status === 401) {
            console.log('Token expired or invalid. Logging out...');
            // Clear the token from local storage
            localStorage.removeItem('aley_token');
            localStorage.removeItem('aley_user_avatar');
            localStorage.removeItem('aley_user_name');
            
            // Show notification and redirect if AleyAPI is available
            if (typeof AleyAPI !== 'undefined' && AleyAPI._showExpiredTokenNotification) {
                AleyAPI._showExpiredTokenNotification();
            } else {
                // Simple notification if AleyAPI is not available
                const notification = document.createElement('div');
                notification.style.position = 'fixed';
                notification.style.top = '0';
                notification.style.left = '0';
                notification.style.width = '100%';
                notification.style.padding = '15px';
                notification.style.backgroundColor = '#f8d7da';
                notification.style.color = '#721c24';
                notification.style.textAlign = 'center';
                notification.style.zIndex = '9999';
                notification.textContent = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại...';
                document.body.prepend(notification);
            }
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
            
            return Promise.reject({ message: 'Session expired' });
        }
        
        // Normal response handling
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    },
    
    /**
     * Tạo bài viết mới
     * @param {Object} postData - Dữ liệu bài viết
     * @param {string} postData.content - Nội dung bài viết
     * @param {File[]} postData.attachments - Mảng các file đính kèm
     * @param {Object} postData.emotion - Cảm xúc
     * @param {string} postData.location - Vị trí
     * @param {string} postData.privacy - Quyền riêng tư ('public', 'friends', 'private')
     * @param {Function} progressCallback - Callback nhận thông tin về tiến độ upload
     * @returns {Promise<Object>} - Thông tin bài viết đã tạo
     */
    createPost: function(postData, progressCallback) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            
            // Thêm nội dung văn bản nếu có
            if (postData.content) {
                formData.append('content', postData.content);
            }
            
            // Thêm tệp đính kèm nếu có
            if (postData.attachments && postData.attachments.length > 0) {
                postData.attachments.forEach(file => {
                    formData.append('attachments[]', file);
                });
            }
            
            // Thêm cảm xúc nếu có
            if (postData.emotion) {
                formData.append('emotion', JSON.stringify(postData.emotion));
            }
            
            // Thêm vị trí nếu có
            if (postData.location) {
                formData.append('location', postData.location);
            }
            
            // Thêm quyền riêng tư
            formData.append('privacy', postData.privacy || 'public');
            
            // Sử dụng XMLHttpRequest để theo dõi tiến độ
            const xhr = new XMLHttpRequest();
            
            // Theo dõi tiến độ tải lên
            if (progressCallback && typeof progressCallback === 'function') {
                xhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        progressCallback(percentComplete);
                    }
                });
            }
            
            xhr.addEventListener('load', function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject({
                            message: 'Lỗi phân tích phản hồi từ máy chủ',
                            status: xhr.status
                        });
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        
                        // Check for token expiration (401 Unauthorized)
                        if (xhr.status === 401) {
                            console.log('Token expired or invalid during post operation. Logging out...');
                            // Clear the token from local storage
                            localStorage.removeItem('aley_token');
                            localStorage.removeItem('aley_user_avatar');
                            localStorage.removeItem('aley_user_name');
                            
                            // Show notification and redirect
                            if (typeof AleyAPI !== 'undefined' && AleyAPI._showExpiredTokenNotification) {
                                AleyAPI._showExpiredTokenNotification();
                            }
                            
                            // Redirect to login page after a short delay
                            setTimeout(() => {
                                window.location.href = '../index.html';
                            }, 1500);
                        }
                        
                        reject(error);
                    } catch (e) {
                        reject({
                            message: 'Đã xảy ra lỗi khi tạo bài viết',
                            status: xhr.status
                        });
                    }
                }
            });
            
            xhr.addEventListener('error', function() {
                reject({
                    message: 'Lỗi kết nối đến máy chủ',
                    status: 0
                });
            });
            
            xhr.addEventListener('abort', function() {
                reject({
                    message: 'Yêu cầu đã bị hủy',
                    status: 0
                });
            });
            
            xhr.open('POST', `${this.baseUrl}/posts`);
            
            // Thêm token xác thực từ localStorage (nếu có)
            const token = localStorage.getItem('aley_token');
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            } else {
                console.warn('Token not found when creating post');
            }
            
            xhr.send(formData);
        });
    },
    
    /**
     * Lấy danh sách bài viết
     * @param {number} page - Số trang
     * @param {number} limit - Số lượng bài viết mỗi trang
     * @returns {Promise<Object>} - Danh sách bài viết công khai
     */
    getPosts: function(page = 1, limit = 10) {
        return fetch(`${this.baseUrl}/posts/list?page=${page}&limit=${limit}`)
            .then(response => this._handleApiResponse(response));
    },
    
    /**
     * Lấy feed bài viết cho người dùng đã đăng nhập
     * @param {number} page - Số trang
     * @param {number} limit - Số lượng bài viết mỗi trang
     * @returns {Promise<Object>} - Feed bài viết
     */
    getFeed: function(page = 1, limit = 10) {
        const token = localStorage.getItem('aley_token');
        if (!token) {
            return Promise.reject({ message: 'User not authenticated' });
        }
        
        return fetch(`${this.baseUrl}/posts/feed?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
            .then(response => this._handleApiResponse(response));
    },
    
    /**
     * Lấy bài viết của một người dùng cụ thể
     * @param {string} userId - ID của người dùng
     * @param {number} page - Số trang
     * @param {number} limit - Số lượng bài viết mỗi trang
     * @returns {Promise<Object>} - Danh sách bài viết của người dùng
     */
    getUserPosts: function(userId, page = 1, limit = 10) {
        const token = localStorage.getItem('aley_token');
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        
        return fetch(`${this.baseUrl}/posts/user/${userId}?page=${page}&limit=${limit}`, {
            headers: headers
        })
            .then(response => this._handleApiResponse(response));
    },
    
    /**
     * Lấy bài viết của người dùng đang đăng nhập
     * @param {number} page - Số trang
     * @param {number} limit - Số lượng bài viết mỗi trang
     * @returns {Promise<Object>} - Danh sách bài viết của người dùng đang đăng nhập
     */
    getMyPosts: function(page = 1, limit = 10) {
        const token = localStorage.getItem('aley_token');
        if (!token) {
            return Promise.reject({ message: 'User not authenticated' });
        }
        
        // Bỏ qua việc thử API "/posts/me", đi thẳng đến phương pháp lọc feed
        return this.getFeed(page, limit)
            .then(feedResponse => {
                if (feedResponse.data && feedResponse.data.posts) {
                    // Lấy thông tin người dùng hiện tại để lọc feed
                    return fetch(`${this.baseUrl}/users/me`, {
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    })
                    .then(userResponse => this._handleApiResponse(userResponse))
                    .then(userData => {
                        // Lọc feed để chỉ lấy bài viết của người dùng hiện tại
                        const filteredPosts = feedResponse.data.posts.filter(post => 
                            post.author && 
                            (post.author.email === userData.email || 
                             post.author.name === userData.fullName)
                        );
                        
                        // Tạo đối tượng phản hồi với định dạng API
                        return {
                            success: true,
                            data: {
                                posts: filteredPosts,
                                total: filteredPosts.length,
                                page: page,
                                limit: limit
                            }
                        };
                    });
                }
                return feedResponse;
            });
    },
    
    /**
     * Thích hoặc bỏ thích bài viết
     * @param {string} postId - ID của bài viết
     * @returns {Promise<Object>} - Thông tin về trạng thái thích
     */
    toggleLike: function(postId) {
        const token = localStorage.getItem('aley_token');
        if (!token) {
            return Promise.reject({ message: 'User not authenticated' });
        }
        
        return fetch(`${this.baseUrl}/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
            .then(response => this._handleApiResponse(response));
    },
    
    /**
     * Xóa bài viết
     * @param {string} postId - ID của bài viết
     * @returns {Promise<Object>} - Thông báo kết quả
     */
    deletePost: function(postId) {
        const token = localStorage.getItem('aley_token');
        if (!token) {
            return Promise.reject({ message: 'User not authenticated' });
        }
        
        return fetch(`${this.baseUrl}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
            .then(response => this._handleApiResponse(response));
    },
    
    /**
     * Cập nhật bài viết
     * @param {string} postId - ID của bài viết
     * @param {Object} updateData - Dữ liệu cần cập nhật
     * @returns {Promise<Object>} - Thông báo kết quả
     */
    updatePost: function(postId, updateData) {
        const token = localStorage.getItem('aley_token');
        if (!token) {
            return Promise.reject({ message: 'User not authenticated' });
        }
        
        return fetch(`${this.baseUrl}/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(updateData)
        })
            .then(response => this._handleApiResponse(response));
    }
};

/**
 * Module quản lý các chức năng liên quan đến bạn bè
 */
const friendService = {
    // Sử dụng baseUrl từ AleyAPI
    baseUrl: (typeof AleyAPI !== 'undefined') ? AleyAPI.baseUrl : 'https://aley-social-media-website-platform.onrender.com ',
    
    /**
     * Lấy danh sách gợi ý kết bạn (những người chưa kết bạn)
     * @param {number} page - Số trang
     * @param {number} limit - Số lượng kết quả mỗi trang
     * @param {string} search - Từ khóa tìm kiếm (tùy chọn)
     * @returns {Promise} - Promise chứa kết quả API
     */
    getFriendSuggestions: async function(page = 1, limit = 20, search = '') {
        const queryParams = new URLSearchParams({
            page, 
            limit,
            ...(search && { search })
        }).toString();
        
        const response = await fetch(`${this.baseUrl}/friends/suggestions?${queryParams}`, {
            method: 'GET',
            headers: {
                ...this._getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        
        return this._handleApiResponse(response);
    },
    
    /**
     * Kiểm tra trạng thái kết bạn với một người dùng
     * @param {string} userId - ID của người dùng cần kiểm tra
     * @returns {Promise} - Promise chứa kết quả API
     */
    checkFriendshipStatus: async function(userId) {
        console.log(`Checking friendship status for user ID: ${userId}`);
        
        try {
            const response = await fetch(`${this.baseUrl}/friends/status/${userId}`, {
                method: 'GET',
                headers: {
                    ...this._getAuthHeader()
                }
            });
            
            return this._handleApiResponse(response);
        } catch (error) {
            console.error('Error checking friendship status:', error);
            throw error;
        }
    },
    
    /**
     * Gửi lời mời kết bạn
     * @param {string} recipientId - ID của người nhận lời mời
        // Danh sách hardcoded các ID đã là bạn bè (cho môi trường development)
        // Bạn có thể thêm các ID người dùng đã là bạn bè vào đây
        const knownFriendIds = ['67d5844f88ab647b4c169ada', '67d50c6c228b7c45a385c281'];
        
        // Nếu userId nằm trong danh sách đã biết là bạn bè, trả về trạng thái bạn bè
        if (knownFriendIds.includes(userId)) {
            console.log(`User ${userId} is in known friends list - returning friends status`);
            return {
                success: true,
                data: {
                    status: 'friends',
                    user_id: userId,
                    friendship_id: `friendship_${userId}_${Date.now()}`
                }
            };
        }
        
        try {
            // Cố gắng gọi API, nhưng hiện tại đang gặp vấn đề CORS
            // Tạm thời wrap trong try/catch để xử lý lỗi một cách nhẹ nhàng
            
            // Kiểm tra xem có đang gặp phải vấn đề CORS không bằng cách gửi request OPTIONS
            const checkCorsResponse = await fetch(`${this.baseUrl}/ping`, {
                method: 'OPTIONS',
                headers: {
                    ...this._getAuthHeader()
                }
            }).catch(e => {
                console.log('CORS preflight check failed, likely CORS issues');
                return null;
            });
            
            // Nếu không thể truy cập API do CORS, trả về kết quả dựa trên hardcoded data
            if (!checkCorsResponse || !checkCorsResponse.ok) {
                console.log('Using hardcoded data due to API access issues');
                
                // Mảng ID người dùng đã gửi lời mời - cho môi trường development
                const pendingSentIds = []; // Thêm ID nếu cần
                
                // Mảng ID người dùng đã nhận lời mời - cho môi trường development
                const pendingReceivedIds = []; // Thêm ID nếu cần
                
                if (pendingSentIds.includes(userId)) {
                    return {
                        success: true,
                        data: {
                            status: 'pending_sent',
                            user_id: userId,
                            request_id: `request_${userId}_${Date.now()}`
                        }
                    };
                } else if (pendingReceivedIds.includes(userId)) {
                    return {
                        success: true,
                        data: {
                            status: 'pending_received',
                            user_id: userId,
                            request_id: `request_${userId}_${Date.now()}`
                        }
                    };
                } else {
                    return {
                        success: true,
                        data: {
                            status: 'not_friends',
                            user_id: userId
                        }
                    };
                }
            }
            
            // Nếu CORS không phải là vấn đề, tiếp tục với API calls như trước
            // (Dù hiện tại đang gặp vấn đề CORS)
            
            // Kiểm tra trạng thái bạn bè
            const response = await fetch(`${this.baseUrl}/friends/status?user_id=${userId}`, {
                method: 'GET',
                headers: {
                    ...this._getAuthHeader()
                }
            });
            
            const result = await this._handleApiResponse(response);
            console.log(`Direct friendship check result:`, result);
            
            // Nếu API trả về kết quả hợp lệ, sử dụng nó
            if (result.success && result.data) {
                return result;
            }
            
            // Phương pháp dự phòng - kiểm tra qua các API khác nếu API trên không tồn tại
            
            // 1. Kiểm tra trong lời mời đã gửi
            const sentRequestsResponse = await fetch(`${this.baseUrl}/friends/requests/sent?page=1&limit=100`, {
                method: 'GET',
                headers: {
                    ...this._getAuthHeader()
                }
            });
            
            const sentRequests = await this._handleApiResponse(sentRequestsResponse);
            
            if (sentRequests.success && sentRequests.data && sentRequests.data.requests) {
                const sentRequest = sentRequests.data.requests.find(req => 
                    req.recipient && (req.recipient.user_id === userId || req.recipient_id === userId)
                );
                
                if (sentRequest) {
                    return {
                        success: true,
                        data: {
                            status: 'pending_sent',
                            user_id: userId,
                            request_id: sentRequest.request_id
                        }
                    };
                }
            }
            
            // 2. Kiểm tra trong lời mời đã nhận
            const receivedRequestsResponse = await fetch(`${this.baseUrl}/friends/requests/received?page=1&limit=100`, {
                method: 'GET',
                headers: {
                    ...this._getAuthHeader()
                }
            });
            
            const receivedRequests = await this._handleApiResponse(receivedRequestsResponse);
            
            if (receivedRequests.success && receivedRequests.data && receivedRequests.data.requests) {
                const receivedRequest = receivedRequests.data.requests.find(req => 
                    req.sender && (req.sender.user_id === userId || req.sender_id === userId)
                );
                
                if (receivedRequest) {
                    return {
                        success: true,
                        data: {
                            status: 'pending_received',
                            user_id: userId,
                            request_id: receivedRequest.request_id
                        }
                    };
                }
            }
            
            // 3. Kiểm tra trực tiếp trong danh sách bạn bè
            // Endpoint này cần được cài đặt ở backend - truy vấn trực tiếp friendships collection
            try {
                const friendshipsResponse = await fetch(`${this.baseUrl}/friends/list?page=1&limit=100`, {
                    method: 'GET',
                    headers: {
                        ...this._getAuthHeader()
                    }
                });
                
                const friendships = await this._handleApiResponse(friendshipsResponse);
                
                if (friendships.success && friendships.data && friendships.data.friends) {
                    const friendship = friendships.data.friends.find(friend => 
                        friend.user_id === userId || friend.id === userId
                    );
                    
                    if (friendship) {
                        return {
                            success: true,
                            data: {
                                status: 'friends',
                                user_id: userId,
                                friendship_id: friendship.friendship_id
                            }
                        };
                    }
                }
            } catch (e) {
                console.warn('Error checking friendship list, continuing with other methods', e);
            }
            
            // 4. Kiểm tra trong gợi ý kết bạn
            const suggestionsResponse = await fetch(`${this.baseUrl}/friends/suggestions?page=1&limit=100`, {
                method: 'GET',
                headers: {
                    ...this._getAuthHeader()
                }
            });
            
            const suggestions = await this._handleApiResponse(suggestionsResponse);
            
            if (suggestions.success && suggestions.data && suggestions.data.suggestions) {
                const suggestion = suggestions.data.suggestions.find(sug => 
                    sug.user_id === userId
                );
                
                if (suggestion) {
                    return {
                        success: true,
                        data: {
                            status: 'not_friends',
                            user_id: userId
                        }
                    };
                }
            }
            
            // Kiểm tra trực tiếp trạng thái bạn bè từ MongoDB - cần thêm endpoint ở backend
            try {
                const directCheckResponse = await fetch(`${this.baseUrl}/friends/direct-check/${userId}`, {
                    method: 'GET',
                    headers: {
                        ...this._getAuthHeader()
                    }
                });
                
                const directCheck = await this._handleApiResponse(directCheckResponse);
                if (directCheck.success) {
                    return directCheck;
                }
            } catch (e) {
                console.warn('Error with direct friendship check, continuing', e);
            }
            
            // Nếu tất cả đều không tìm thấy, giả định không phải là bạn bè
            return {
                success: true,
                data: {
                    status: 'not_friends',
                    user_id: userId
                }
            };
            
        } catch (error) {
            console.error('Error checking friendship status:', error);
            // Nếu xảy ra lỗi, kiểm tra hardcoded data trước khi trả về trạng thái mặc định
            if (knownFriendIds.includes(userId)) {
                return {
                    success: true,
                    data: {
                        status: 'friends',
                        user_id: userId,
                        friendship_id: `friendship_${userId}_${Date.now()}`
                    }
                };
            }
            
            // Nếu không có trong hardcoded data, trả về trạng thái mặc định
            return {
                success: true,
                data: {
                    status: 'not_friends',
                    user_id: userId
                }
            };
        }
    },
    
    /**
     * Gửi lời mời kết bạn
     * @param {string} recipientId - ID của người nhận lời mời
     * @returns {Promise} - Promise chứa kết quả API
     */
    sendFriendRequest: async function(recipientId) {
        console.log(`Sending friend request to user ID: ${recipientId}`);
        
        const response = await fetch(`${this.baseUrl}/friends/requests`, {
            method: 'POST',
            headers: {
                ...this._getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipient_id: recipientId })
        });
        
        return this._handleApiResponse(response);
    },
    
    /**
     * Hủy lời mời kết bạn đã gửi
     * @param {string} requestId - ID của lời mời kết bạn
     * @returns {Promise} - Promise chứa kết quả API
     */
    cancelFriendRequest: async function(requestId) {
        console.log(`Canceling friend request ID: ${requestId}`);
        
        const response = await fetch(`${this.baseUrl}/friends/requests/${requestId}`, {
            method: 'DELETE',
            headers: {
                ...this._getAuthHeader()
            }
        });
        
        return this._handleApiResponse(response);
    },
    
    /**
     * Huỷ kết bạn với một người dùng
     * @param {string} userId - ID của người dùng cần huỷ kết bạn
     * @returns {Promise} - Promise chứa kết quả API
     */
    unfriendUser: async function(userId) {
        console.log(`Unfriending user: ${userId}`);
        
        try {
            const response = await fetch(`${this.baseUrl}/friends/${userId}`, {
                method: 'DELETE',
                headers: {
                    ...this._getAuthHeader()
                }
            });
            
            return this._handleApiResponse(response);
        } catch (error) {
            console.error('Error unfriending user:', error);
            throw error;
        }
    },
    
    /**
     * Chấp nhận lời mời kết bạn
     * @param {string} requestId - ID của lời mời kết bạn
     * @returns {Promise} - Promise chứa kết quả API
     */
    acceptFriendRequest: async function(requestId) {
        console.log(`Accepting friend request ID: ${requestId}`);
        
        const response = await fetch(`${this.baseUrl}/friends/requests/${requestId}/accept`, {
            method: 'PATCH',
            headers: {
                ...this._getAuthHeader()
            }
        });
        
        return this._handleApiResponse(response);
    },
    
    /**
     * Lấy danh sách lời mời kết bạn đã nhận
     * @param {number} page - Số trang
     * @param {number} limit - Số lượng kết quả mỗi trang
     * @returns {Promise} - Promise chứa kết quả API
     */
    getReceivedFriendRequests: async function(page = 1, limit = 20) {
        const response = await fetch(`${this.baseUrl}/friends/requests/received?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: {
                ...this._getAuthHeader()
            }
        });
        
        return this._handleApiResponse(response);
    },
    
    /**
     * Lấy danh sách lời mời kết bạn đã gửi
     * @param {number} page - Số trang
     * @param {number} limit - Số lượng kết quả mỗi trang
     * @returns {Promise} - Promise chứa kết quả API
     */
    getSentFriendRequests: async function(page = 1, limit = 20) {
        const response = await fetch(`${this.baseUrl}/friends/requests/sent?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: {
                ...this._getAuthHeader()
            }
        });
        
        return this._handleApiResponse(response);
    },
    
    /**
     * Utility function to get auth header
     * @returns {Object} - The auth header object
     */
    _getAuthHeader: function() {
        const token = localStorage.getItem('aley_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },
    
    /**
     * Utility function to handle API response
     * @param {Response} response - The fetch API response
     * @returns {Promise} - Resolved with data or rejected with error
     */
    _handleApiResponse: async function(response) {
        try {
            const data = await response.json();
            
            if (!response.ok) {
                console.error('API error:', data);
                
                // Tạo lỗi chi tiết hơn với thông tin từ phản hồi API
                const error = new Error(data.error?.message || 'Something went wrong');
                
                // Sao chép các thuộc tính từ data.error vào đối tượng lỗi để sử dụng sau này
                if (data.error) {
                    error.code = data.error.code;
                    error.status = response.status;
                    
                    // Đối với lỗi 409 CONFLICT khi gửi lời mời kết bạn, cố gắng lấy request_id
                    if (response.status === 409 && data.error.code === 'REQUEST_ALREADY_SENT') {
                        // Nếu có dữ liệu bổ sung trong phản hồi, ví dụ như request_id
                        if (data.data && data.data.request_id) {
                            error.request_id = data.data.request_id;
                        }
                    }
                }
                
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }
};

// Thêm module postService vào apiService
if (typeof apiService !== 'undefined') {
    apiService.posts = postService;
} else {
    // Nếu apiService chưa được định nghĩa, tạo mới
    const apiService = {
        posts: postService
    };
    
    // Expose apiService to global scope
    window.apiService = apiService;
}

// Thêm friendService vào đối tượng apiService để sử dụng từ bất kỳ tệp nào
if (typeof apiService === 'undefined') {
    window.apiService = {};
}

apiService.friends = friendService;
