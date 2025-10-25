// 用戶資料管理系統
class ProfileManager {
  constructor() {
    this.authSystem = new AuthSystem();
    this.currentUser = this.authSystem.getCurrentUser();
    
    if (!this.currentUser) {
      // 如果用戶未登入，重定向到登入頁面
      window.location.href = 'auth.html?action=login';
      return;
    }
    
    this.initializeProfile();
    this.setupEventListeners();
  }

  // 初始化用戶資料顯示
  initializeProfile() {
    this.loadProfileData();
    this.loadPreferences();
  }

  // 載入用戶資料到表單
  loadProfileData() {
    const user = this.currentUser;
    
    // 基本資訊
    document.getElementById('profile-display-name').textContent = user.profile.displayName;
    document.getElementById('profile-username').textContent = `@${user.username}`;
    document.getElementById('profile-join-date').textContent = new Date(user.createdAt).toLocaleDateString('zh-TW');
    document.getElementById('profile-last-login').textContent = user.lastLoginAt ? 
      new Date(user.lastLoginAt).toLocaleDateString('zh-TW') : '首次登入';

    // 編輯表單
    document.getElementById('edit-display-name').value = user.profile.displayName;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-phone').value = user.phone || '';
    document.getElementById('edit-bio').value = user.profile.bio || '';

    // 頭像
    this.updateAvatar();
  }

  // 載入用戶偏好設定
  loadPreferences() {
    const preferences = this.currentUser.profile.preferences || {};
    
    document.getElementById('notifications-enabled').checked = preferences.notifications !== false;
    document.getElementById('newsletter-enabled').checked = preferences.newsletter !== false;
    document.getElementById('theme-select').value = preferences.theme || 'auto';
  }

  // 更新頭像顯示
  updateAvatar() {
    const avatarImg = document.getElementById('user-avatar');
    const user = this.currentUser;
    
    if (user.profile.avatar) {
      avatarImg.src = user.profile.avatar;
    } else {
      // 生成用戶名稱首字母頭像
      const initial = user.profile.displayName.charAt(0).toUpperCase();
      const colors = ['#3880ff', '#3dc2ff', '#2dd36f', '#ffc409', '#eb445a', '#9f4f96'];
      const color = colors[user.username.length % colors.length];
      
      const svg = `
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="50" fill="${color}"/>
          <text x="50" y="55" font-family="Arial" font-size="30" fill="white" text-anchor="middle">${initial}</text>
        </svg>
      `;
      
      avatarImg.src = `data:image/svg+xml;base64,${btoa(svg)}`;
    }
  }

  // 設置事件監聽器
  setupEventListeners() {
    // 個人資訊表單提交
    const profileForm = document.getElementById('profile-form');
    profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));

    // 偏好設定儲存
    const savePreferencesBtn = document.getElementById('save-preferences-btn');
    savePreferencesBtn.addEventListener('click', () => this.handlePreferencesUpdate());

    // 變更密碼表單提交
    const changePasswordForm = document.getElementById('change-password-form');
    changePasswordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));

    // 即時密碼確認驗證
    const newPassword = document.getElementById('new-password');
    const confirmNewPassword = document.getElementById('confirm-new-password');
    if (newPassword && confirmNewPassword) {
      confirmNewPassword.addEventListener('input', () => this.validateNewPasswordMatch());
      newPassword.addEventListener('input', () => this.validateNewPasswordMatch());
    }
  }

  // 處理個人資訊更新
  async handleProfileUpdate(event) {
    event.preventDefault();
    
    const displayName = document.getElementById('edit-display-name').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();

    // 基本驗證
    if (!displayName || displayName.length < 1 || displayName.length > 30) {
      this.showToast('顯示名稱必須為1-30個字元', 'warning');
      return;
    }

    // 顯示載入狀態
    this.setButtonLoading('save-profile-btn', true);

    try {
      // 模擬API請求延遲
      await this.delay(800);

      // 更新用戶資料
      this.currentUser.profile.displayName = displayName;
      this.currentUser.phone = phone;
      this.currentUser.profile.bio = bio;
      this.currentUser.updatedAt = new Date().toISOString();

      // 保存到本地存儲
      this.authSystem.saveUsers();
      this.authSystem.login(this.currentUser, localStorage.getItem('maxSports_rememberMe') === 'true');

      // 更新顯示
      this.loadProfileData();

      this.showToast('個人資訊已成功更新', 'success');

    } catch (error) {
      console.error('更新個人資訊失敗:', error);
      this.showToast('更新失敗，請稍後再試', 'error');
    } finally {
      this.setButtonLoading('save-profile-btn', false);
    }
  }

  // 處理偏好設定更新
  async handlePreferencesUpdate() {
    const notifications = document.getElementById('notifications-enabled').checked;
    const newsletter = document.getElementById('newsletter-enabled').checked;
    const theme = document.getElementById('theme-select').value;

    // 顯示載入狀態
    this.setButtonLoading('save-preferences-btn', true);

    try {
      // 模擬API請求延遲
      await this.delay(500);

      // 更新偏好設定
      this.currentUser.profile.preferences = {
        notifications,
        newsletter,
        theme
      };
      this.currentUser.updatedAt = new Date().toISOString();

      // 保存到本地存儲
      this.authSystem.saveUsers();
      this.authSystem.login(this.currentUser, localStorage.getItem('maxSports_rememberMe') === 'true');

      // 應用主題設定
      this.applyTheme(theme);

      this.showToast('偏好設定已成功儲存', 'success');

    } catch (error) {
      console.error('儲存偏好設定失敗:', error);
      this.showToast('儲存失敗，請稍後再試', 'error');
    } finally {
      this.setButtonLoading('save-preferences-btn', false);
    }
  }

  // 處理密碼變更
  async handlePasswordChange(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;

    // 驗證目前密碼
    const hashedCurrentPassword = this.authSystem.hashPassword(currentPassword);
    if (hashedCurrentPassword !== this.currentUser.password) {
      this.showToast('目前密碼不正確', 'error');
      return;
    }

    // 驗證新密碼
    if (newPassword.length < 6) {
      this.showToast('新密碼至少需要6個字元', 'warning');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      this.showToast('新密碼與確認密碼不一致', 'warning');
      return;
    }

    if (currentPassword === newPassword) {
      this.showToast('新密碼不能與目前密碼相同', 'warning');
      return;
    }

    // 顯示載入狀態
    this.setButtonLoading('submit-password-btn', true);

    try {
      // 模擬API請求延遲
      await this.delay(1000);

      // 更新密碼
      this.currentUser.password = this.authSystem.hashPassword(newPassword);
      this.currentUser.passwordChangedAt = new Date().toISOString();
      this.currentUser.updatedAt = new Date().toISOString();

      // 保存到本地存儲
      this.authSystem.saveUsers();
      this.authSystem.login(this.currentUser, localStorage.getItem('maxSports_rememberMe') === 'true');

      // 清空表單
      document.getElementById('change-password-form').reset();
      this.hideChangePassword();

      this.showToast('密碼已成功變更', 'success');

    } catch (error) {
      console.error('變更密碼失敗:', error);
      this.showToast('變更失敗，請稍後再試', 'error');
    } finally {
      this.setButtonLoading('submit-password-btn', false);
    }
  }

  // 即時新密碼匹配驗證
  validateNewPasswordMatch() {
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;
    const confirmPasswordItem = document.getElementById('confirm-new-password').closest('ion-item');
    
    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      confirmPasswordItem.classList.add('error');
    } else {
      confirmPasswordItem.classList.remove('error');
    }
  }

  // 應用主題設定
  applyTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    
    if (theme === 'light') {
      body.classList.add('theme-light');
    } else if (theme === 'dark') {
      body.classList.add('theme-dark');
    } else {
      body.classList.add('theme-auto');
    }
  }

  // 工具方法
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 頁面控制函數
function showChangePassword() {
  document.getElementById('change-password-section').style.display = 'block';
  document.getElementById('current-password').focus();
}

function hideChangePassword() {
  document.getElementById('change-password-section').style.display = 'none';
  document.getElementById('change-password-form').reset();
}

function showDeleteAccount() {
  const confirmed = confirm(
    '警告：此操作無法復原！\n\n確定要刪除您的帳戶嗎？這將永久刪除您的所有資料和活動記錄。\n\n點擊「確定」繼續刪除，點擊「取消」保留帳戶。'
  );
  
  if (confirmed) {
    const doubleConfirm = prompt('請輸入「刪除我的帳戶」來確認刪除操作：');
    
    if (doubleConfirm === '刪除我的帳戶') {
      deleteUserAccount();
    } else {
      alert('確認文字不正確，帳戶刪除已取消。');
    }
  }
}

async function deleteUserAccount() {
  try {
    const authSystem = new AuthSystem();
    const currentUser = authSystem.getCurrentUser();
    
    if (!currentUser) {
      alert('找不到用戶資料');
      return;
    }

    // 從用戶列表中移除
    const users = authSystem.loadUsers();
    const updatedUsers = users.filter(user => user.id !== currentUser.id);
    localStorage.setItem('maxSports_users', JSON.stringify(updatedUsers));

    // 清除登入狀態
    authSystem.logout();

    alert('帳戶已成功刪除。感謝您使用MAX運動平台！');
    
  } catch (error) {
    console.error('刪除帳戶失敗:', error);
    alert('刪除帳戶時發生錯誤，請稍後再試。');
  }
}

function uploadAvatar() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 檢查檔案大小（限制為2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('檔案大小不能超過2MB');
      return;
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇有效的圖片檔案');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const imageData = e.target.result;
      
      // 更新用戶頭像
      const authSystem = new AuthSystem();
      const currentUser = authSystem.getCurrentUser();
      
      if (currentUser) {
        currentUser.profile.avatar = imageData;
        currentUser.updatedAt = new Date().toISOString();
        
        // 保存到本地存儲
        authSystem.saveUsers();
        authSystem.login(currentUser, localStorage.getItem('maxSports_rememberMe') === 'true');
        
        // 更新顯示
        document.getElementById('user-avatar').src = imageData;
        
        // 顯示成功訊息
        const profileManager = window.profileManager;
        if (profileManager) {
          profileManager.showToast('頭像已成功更新', 'success');
        }
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  input.click();
}

function goToHome() {
  window.location.href = 'index.html';
}

function handleLogout() {
  if (confirm('確定要登出嗎？')) {
    const authSystem = new AuthSystem();
    authSystem.logout();
  }
}

// 初始化資料管理系統
document.addEventListener('DOMContentLoaded', () => {
  window.profileManager = new ProfileManager();
});