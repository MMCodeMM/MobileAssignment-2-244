// 用戶認證系統
class AuthSystem {
  constructor() {
    this.users = this.loadUsers();
    this.currentUser = this.loadCurrentUser();
    this.initializeEventListeners();
  }

  // 初始化事件監聽器
  initializeEventListeners() {
    // 註冊表單提交
    const registerForm = document.getElementById('registration-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // 登入表單提交
    const loginForm = document.getElementById('login-form-element');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // 忘記密碼表單提交
    const forgotForm = document.getElementById('forgot-password-form-element');
    if (forgotForm) {
      forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
    }

    // 密碼確認即時驗證
    const confirmPassword = document.getElementById('register-confirm-password');
    const password = document.getElementById('register-password');
    if (confirmPassword && password) {
      confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
      password.addEventListener('input', () => this.validatePasswordMatch());
    }

    // 電子郵件格式驗證
    const emailInputs = document.querySelectorAll('ion-input[type="email"]');
    emailInputs.forEach(input => {
      input.addEventListener('ionBlur', (e) => this.validateEmail(e.target));
    });

    // 用戶名稱即時驗證
    const usernameInput = document.getElementById('register-username');
    if (usernameInput) {
      usernameInput.addEventListener('ionBlur', (e) => this.validateUsername(e.target));
    }
  }

  // 處理註冊
  async handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const phone = document.getElementById('register-phone').value.trim();
    const acceptTerms = document.getElementById('terms-checkbox').checked;

    // 表單驗證
    if (!this.validateRegisterForm(username, email, password, confirmPassword, acceptTerms)) {
      return;
    }

    // 檢查用戶是否已存在
    if (this.isUserExists(username, email)) {
      this.showToast('用戶名稱或電子郵件已被使用', 'error');
      return;
    }

    // 顯示載入狀態
    this.setButtonLoading('register-btn', true);

    try {
      // 模擬API請求延遲
      await this.delay(1000);

      // 創建新用戶
      const newUser = {
        id: this.generateUserId(),
        username,
        email,
        password: this.hashPassword(password), // 在實際應用中應使用更安全的加密方式
        phone,
        createdAt: new Date().toISOString(),
        isActive: true,
        profile: {
          avatar: null,
          displayName: username,
          bio: '',
          preferences: {
            notifications: true,
            newsletter: true
          }
        }
      };

      // 保存用戶
      this.users.push(newUser);
      this.saveUsers();

      // 自動登入
      this.login(newUser);

      this.showToast('註冊成功！歡迎加入MAX運動平台', 'success');
      
      // 延遲跳轉到主頁面
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);

    } catch (error) {
      console.error('註冊失敗:', error);
      this.showToast('註冊失敗，請稍後再試', 'error');
    } finally {
      this.setButtonLoading('register-btn', false);
    }
  }

  // 處理登入
  async handleLogin(event) {
    event.preventDefault();
    
    const usernameOrEmail = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-checkbox').checked;

    if (!usernameOrEmail || !password) {
      this.showToast('請填寫所有必填欄位', 'warning');
      return;
    }

    // 顯示載入狀態
    this.setButtonLoading('login-btn', true);

    try {
      // 模擬API請求延遲
      await this.delay(800);

      // 查找用戶
      const user = this.findUser(usernameOrEmail, password);
      
      if (!user) {
        this.showToast('用戶名稱/電子郵件或密碼錯誤', 'error');
        return;
      }

      if (!user.isActive) {
        this.showToast('帳戶已被停用，請聯繫客服', 'error');
        return;
      }

      // 登入成功
      this.login(user, rememberMe);
      this.showToast(`歡迎回來，${user.profile.displayName}！`, 'success');
      
      // 跳轉到主頁面
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);

    } catch (error) {
      console.error('登入失敗:', error);
      this.showToast('登入失敗，請稍後再試', 'error');
    } finally {
      this.setButtonLoading('login-btn', false);
    }
  }

  // 處理忘記密碼
  async handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgot-email').value.trim();

    if (!this.isValidEmail(email)) {
      this.showToast('請輸入有效的電子郵件地址', 'warning');
      return;
    }

    // 顯示載入狀態
    this.setButtonLoading('forgot-btn', true);

    try {
      // 模擬API請求延遲
      await this.delay(1000);

      // 檢查電子郵件是否存在
      const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        // 為了安全起見，即使電子郵件不存在也顯示成功訊息
        this.showToast('如果該電子郵件地址存在，重設密碼連結已發送', 'success');
      } else {
        // 在實際應用中，這裡會發送重設密碼的電子郵件
        console.log('重設密碼請求:', { email, userId: user.id });
        this.showToast('重設密碼連結已發送到您的電子郵件', 'success');
      }

      // 清空表單並返回登入頁面
      document.getElementById('forgot-email').value = '';
      setTimeout(() => {
        showLogin();
      }, 2000);

    } catch (error) {
      console.error('重設密碼失敗:', error);
      this.showToast('發送失敗，請稍後再試', 'error');
    } finally {
      this.setButtonLoading('forgot-btn', false);
    }
  }

  // 表單驗證方法
  validateRegisterForm(username, email, password, confirmPassword, acceptTerms) {
    // 用戶名稱驗證
    if (!username || username.length < 3 || username.length > 20) {
      this.showToast('用戶名稱必須為3-20個字元', 'warning');
      return false;
    }

    // 電子郵件驗證
    if (!this.isValidEmail(email)) {
      this.showToast('請輸入有效的電子郵件地址', 'warning');
      return false;
    }

    // 密碼驗證
    if (!password || password.length < 6) {
      this.showToast('密碼至少需要6個字元', 'warning');
      return false;
    }

    // 密碼確認驗證
    if (password !== confirmPassword) {
      this.showToast('密碼與確認密碼不一致', 'warning');
      return false;
    }

    // 服務條款驗證
    if (!acceptTerms) {
      this.showToast('請同意服務條款和隱私政策', 'warning');
      return false;
    }

    return true;
  }

  // 即時密碼匹配驗證
  validatePasswordMatch() {
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const confirmPasswordItem = document.getElementById('register-confirm-password').closest('ion-item');
    
    if (confirmPassword && password !== confirmPassword) {
      confirmPasswordItem.classList.add('error');
      this.showFieldError('register-confirm-password', '密碼不一致');
    } else {
      confirmPasswordItem.classList.remove('error');
      this.hideFieldError('register-confirm-password');
    }
  }

  // 電子郵件格式驗證
  validateEmail(emailInput) {
    const email = emailInput.value.trim();
    const emailItem = emailInput.closest('ion-item');
    
    if (email && !this.isValidEmail(email)) {
      emailItem.classList.add('error');
      this.showFieldError(emailInput.id, '請輸入有效的電子郵件地址');
    } else {
      emailItem.classList.remove('error');
      this.hideFieldError(emailInput.id);
    }
  }

  // 用戶名稱驗證
  validateUsername(usernameInput) {
    const username = usernameInput.value.trim();
    const usernameItem = usernameInput.closest('ion-item');
    
    if (username && (username.length < 3 || username.length > 20)) {
      usernameItem.classList.add('error');
      this.showFieldError(usernameInput.id, '用戶名稱必須為3-20個字元');
    } else if (username && this.isUsernameExists(username)) {
      usernameItem.classList.add('error');
      this.showFieldError(usernameInput.id, '此用戶名稱已被使用');
    } else {
      usernameItem.classList.remove('error');
      this.hideFieldError(usernameInput.id);
    }
  }

  // 工具方法
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isUserExists(username, email) {
    return this.users.some(user => 
      user.username.toLowerCase() === username.toLowerCase() || 
      user.email.toLowerCase() === email.toLowerCase()
    );
  }

  isUsernameExists(username) {
    return this.users.some(user => 
      user.username.toLowerCase() === username.toLowerCase()
    );
  }

  findUser(usernameOrEmail, password) {
    const hashedPassword = this.hashPassword(password);
    return this.users.find(user => 
      (user.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
       user.email.toLowerCase() === usernameOrEmail.toLowerCase()) &&
      user.password === hashedPassword
    );
  }

  // 簡單的密碼哈希（實際應用中應使用更安全的方法）
  hashPassword(password) {
    return btoa(password + 'MAX_SPORTS_SALT').split('').reverse().join('');
  }

  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 用戶狀態管理
  login(user, rememberMe = false) {
    this.currentUser = user;
    
    // 更新最後登入時間
    user.lastLoginAt = new Date().toISOString();
    this.saveUsers();
    
    // 保存當前用戶狀態
    if (rememberMe) {
      localStorage.setItem('maxSports_currentUser', JSON.stringify(user));
      localStorage.setItem('maxSports_rememberMe', 'true');
    } else {
      sessionStorage.setItem('maxSports_currentUser', JSON.stringify(user));
      localStorage.removeItem('maxSports_rememberMe');
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('maxSports_currentUser');
    sessionStorage.removeItem('maxSports_currentUser');
    localStorage.removeItem('maxSports_rememberMe');
    window.location.href = 'auth.html';
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // 數據持久化
  loadUsers() {
    const users = localStorage.getItem('maxSports_users');
    return users ? JSON.parse(users) : [];
  }

  saveUsers() {
    localStorage.setItem('maxSports_users', JSON.stringify(this.users));
  }

  loadCurrentUser() {
    // 優先從 localStorage 載入（記住我功能）
    let user = localStorage.getItem('maxSports_currentUser');
    if (user && localStorage.getItem('maxSports_rememberMe')) {
      return JSON.parse(user);
    }
    
    // 從 sessionStorage 載入
    user = sessionStorage.getItem('maxSports_currentUser');
    return user ? JSON.parse(user) : null;
  }

  // UI 控制方法
  setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      const originalText = button.innerHTML;
      button.setAttribute('data-original-text', originalText);
      button.innerHTML = '<div class="loading-spinner"></div>處理中...';
    } else {
      button.disabled = false;
      const originalText = button.getAttribute('data-original-text');
      if (originalText) {
        button.innerHTML = originalText;
      }
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);

    // 自動移除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }

  showFieldError(fieldId, message) {
    this.hideFieldError(fieldId);
    
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message show';
    errorDiv.textContent = message;
    errorDiv.id = fieldId + '_error';
    
    field.closest('ion-item').insertAdjacentElement('afterend', errorDiv);
  }

  hideFieldError(fieldId) {
    const errorDiv = document.getElementById(fieldId + '_error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 表單切換函數
function showRegister() {
  document.getElementById('register-form').style.display = 'block';
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('forgot-password-form').style.display = 'none';
}

function showLogin() {
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('forgot-password-form').style.display = 'none';
}

function showForgotPassword() {
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('forgot-password-form').style.display = 'block';
}

// 模態框函數
function showTerms() {
  document.getElementById('terms-modal').style.display = 'flex';
}

function showPrivacy() {
  document.getElementById('privacy-modal').style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// 返回主頁面
function goToHome() {
  window.location.href = 'index.html';
}

// 初始化認證系統
document.addEventListener('DOMContentLoaded', () => {
  window.authSystem = new AuthSystem();
  
  // 檢查URL參數決定顯示哪個表單
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  
  if (action === 'login') {
    showLogin();
  } else if (action === 'forgot') {
    showForgotPassword();
  } else {
    showRegister(); // 默認顯示註冊表單
  }
});