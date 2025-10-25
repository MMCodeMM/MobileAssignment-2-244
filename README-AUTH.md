# MAX教學運動平台 - 用戶認證系統

## 新增功能概述

為MAX教學運動平台添加了完整的用戶認證系統，包括用戶註冊、登入、個人資料管理等功能。

## 功能特色

### 🔐 用戶認證
- **用戶註冊**: 支援用戶名稱、電子郵件、密碼、手機號碼註冊
- **用戶登入**: 支援用戶名稱或電子郵件登入
- **記住我功能**: 可選擇是否保持登入狀態
- **忘記密碼**: 重設密碼功能（模擬）
- **自動登入**: 註冊成功後自動登入

### 👤 個人資料管理
- **資料編輯**: 修改顯示名稱、手機號碼、個人簡介
- **頭像上傳**: 支援圖片上傳作為用戶頭像
- **密碼變更**: 安全的密碼變更流程
- **偏好設定**: 通知、電子報、主題等設定
- **帳戶刪除**: 完整的帳戶刪除功能

### 🔒 安全特性
- **密碼加密**: 使用簡單的哈希加密儲存密碼
- **表單驗證**: 即時驗證用戶輸入
- **登入狀態檢查**: 自動檢查並維護登入狀態
- **用戶權限**: 未登入用戶會被重定向到登入頁面

### 🎨 用戶體驗
- **響應式設計**: 支援各種螢幕尺寸
- **深色模式**: 自動偵測系統主題偏好
- **載入動畫**: 平滑的載入與過渡效果
- **錯誤處理**: 友善的錯誤提示與處理
- **Toast 通知**: 即時的操作反饋

## 檔案結構

```
├── auth.html          # 認證頁面（註冊/登入/忘記密碼）
├── auth.css           # 認證相關樣式
├── auth.js            # 認證系統核心邏輯
├── profile.html       # 用戶資料管理頁面
├── profile.js         # 用戶資料管理邏輯
├── index.html         # 主頁面（已整合認證功能）
└── README-AUTH.md     # 本說明文件
```

## 使用方法

### 1. 啟動應用程式

```bash
# 方法一：使用 Python 簡單伺服器
npm run serve

# 方法二：直接開啟檔案
# 在瀏覽器中開啟 index.html
```

### 2. 用戶註冊
1. 點擊主頁面右上角的用戶圖標
2. 選擇「立即註冊」
3. 填寫註冊表單
4. 同意服務條款
5. 點擊「註冊帳戶」

### 3. 用戶登入
1. 在認證頁面選擇「立即登入」
2. 輸入用戶名稱/電子郵件和密碼
3. 可選擇「記住我」保持登入狀態
4. 點擊「登入」

### 4. 個人資料管理
1. 登入後點擊用戶圖標
2. 選擇「用戶資料」
3. 編輯個人資訊、上傳頭像
4. 變更密碼或調整偏好設定
5. 儲存變更

## 資料儲存

### 本地儲存結構
用戶資料儲存在瀏覽器的 `localStorage` 中：

```javascript
// 用戶列表
localStorage.setItem('maxSports_users', JSON.stringify(users));

// 當前登入用戶
localStorage.setItem('maxSports_currentUser', JSON.stringify(user));

// 記住我設定
localStorage.setItem('maxSports_rememberMe', 'true');
```

### 用戶資料結構
```javascript
{
  id: "user_timestamp_randomString",
  username: "用戶名稱",
  email: "電子郵件",
  password: "加密後的密碼",
  phone: "手機號碼",
  createdAt: "創建時間",
  lastLoginAt: "最後登入時間",
  isActive: true,
  profile: {
    avatar: "頭像資料",
    displayName: "顯示名稱",
    bio: "個人簡介",
    preferences: {
      notifications: true,
      newsletter: true,
      theme: "auto"
    }
  }
}
```

## 技術實現

### 前端技術
- **Ionic Framework**: UI 組件庫
- **Vanilla JavaScript**: 核心邏輯實現
- **CSS3**: 樣式與動畫
- **LocalStorage**: 資料持久化

### 安全考量
- 密碼使用簡單哈希加密（實際應用中應使用更安全的方法）
- 表單輸入驗證與清理
- XSS 防護基本措施
- 用戶權限檢查

### 響應式設計
- 支援手機、平板、桌面裝置
- 自適應佈局與字體大小
- Touch-friendly 的互動設計

## 自定義與擴展

### 添加新的驗證規則
在 `auth.js` 的 `validateRegisterForm` 方法中添加：

```javascript
// 自定義驗證邏輯
if (!customValidation(data)) {
  this.showToast('自定義錯誤訊息', 'warning');
  return false;
}
```

### 修改主題顏色
在 `auth.css` 中調整 CSS 變數：

```css
:root {
  --primary-color: #3880ff;
  --success-color: #2dd36f;
  --warning-color: #ffc409;
  --danger-color: #eb445a;
}
```

### 整合後端 API
將本地儲存替換為 API 呼叫：

```javascript
// 在 auth.js 中
async register(userData) {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
}
```

## 已知限制

1. **安全性**: 密碼加密較為簡單，實際應用中需要更強的加密
2. **資料持久性**: 使用 localStorage，清除瀏覽器資料會遺失
3. **忘記密碼**: 目前為模擬功能，需要整合郵件服務
4. **多裝置同步**: 無法跨裝置同步用戶狀態

## 未來改進方向

1. **後端整合**: 連接真實的後端 API
2. **郵件驗證**: 實作電子郵件驗證功能
3. **社群登入**: 支援 Google、Facebook 等第三方登入
4. **二次驗證**: 添加 2FA 安全驗證
5. **用戶角色**: 實作管理員、一般用戶等角色系統
6. **資料匯出**: 提供用戶資料匯出功能

## 問題排除

### 常見問題

**Q: 註冊後無法登入？**
A: 請檢查用戶名稱和密碼是否正確，注意大小寫敏感性。

**Q: 頭像上傳失敗？**
A: 請確保圖片檔案小於 2MB 且為有效的圖片格式。

**Q: 找不到用戶資料？**
A: 可能是瀏覽器清除了 localStorage，請重新註冊。

**Q: 頁面載入慢？**
A: CDN 資源載入可能較慢，建議使用本地資源或更快的 CDN。

### 開發者工具
使用瀏覽器開發者工具查看：
- Application > Local Storage: 檢查用戶資料
- Console: 查看錯誤訊息和除錯資訊
- Network: 檢查資源載入狀況

## 結語

這個用戶認證系統為MAX教學運動平台提供了完整的用戶管理功能，具有良好的用戶體驗和基本的安全性。隨著平台的發展，可以逐步添加更多進階功能和安全措施。

如有任何問題或建議，歡迎提出討論！