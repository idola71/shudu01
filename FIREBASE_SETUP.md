# Firebase 云数据库集成配置指南

## 一、创建 Firebase 项目

1. 访问 [Firebase 控制台](https://console.firebase.google.com/)
2. 点击"创建项目"
3. 输入项目名称，点击"继续"
4. 关闭 Google Analytics（可选），点击"创建项目"

## 二、配置 Firestore 数据库

1. 在 Firebase 控制台左侧菜单点击"Firestore Database"
2. 点击"创建数据库"
3. 选择"测试模式"（后续可改为生产模式）
4. 选择地理位置（建议选择亚洲地区）

## 三、获取 Firebase 配置

1. 在 Firebase 控制台点击"设置"（齿轮图标）→"项目设置"
2. 向下滚动找到"SDK 配置"
3. 复制以下配置信息：
   ```
   apiKey: "YOUR_API_KEY"
   authDomain: "YOUR_AUTH_DOMAIN"
   projectId: "YOUR_PROJECT_ID"
   storageBucket: "YOUR_STORAGE_BUCKET"
   messagingSenderId: "YOUR_SENDER_ID"
   appId: "YOUR_APP_ID"
   ```

## 四、配置项目

### 方法一：使用配置脚本（推荐）

1. 编辑 `setup-firebase.js` 文件，将配置信息填入 `config` 对象
2. 运行命令：
   ```bash
   node setup-firebase.js
   ```

### 方法二：手动修改

修改以下文件中的 Firebase 配置：
- `public/js/firebase-config.js`
- `public/js/firebase-service.js`
- `public/js/leaderboard.js`
- `public/js/paradise-game.js`
- `public/js/message-popup.js`
- `public/js/game.js`
- `public/js/custom-game.js`
- `public/js/custom-editor.js`

## 五、部署到 Vercel

1. 访问 [vercel.com](https://vercel.com) 登录
2. 点击"New Project"
3. 选择"Import Git Repository"或"Upload"
4. 上传项目文件夹
5. 点击"Deploy"

## 六、数据同步说明

### 数据存储结构

```
Firestore
├── sharedGames/          # 共享游戏数据
│   ├── {gameId}/
│   │   ├── gameCode      # 游戏编号
│   │   ├── puzzle        # 完整谜题
│   │   ├── solution      # 解答
│   │   ├── playerPuzzle  # 玩家看到的谜题
│   │   ├── nickname      # 分享者昵称
│   │   ├── slogan        # 游戏标语
│   │   ├── difficulty    # 难度
│   │   ├── shareTime     # 分享时间
│   │   ├── participants  # 参与人数
│   │   ├── completed     # 通关人数
│   │   └── playerRecords # 玩家记录
│
├── leaderboard/          # 排行榜数据
│   ├── {recordId}/
│   │   ├── gameId        # 游戏ID
│   │   ├── name          # 玩家昵称
│   │   ├── time          # 用时（秒）
│   │   ├── errors        # 错误次数
│   │   └── date          # 日期
│
└── messages/             # 站内信数据
    ├── {messageId}/
    │   ├── title         # 标题
    │   ├── content       # 内容
    │   ├── time          # 时间
    │   ├── read          # 是否已读
    │   ├── type          # 类型
    │   ├── gameId        # 关联游戏ID
    │   └── userId        # 用户ID
```

### 本地存储兼容

项目采用本地存储与云端存储双备份策略：
- 如果 Firebase 不可用，自动回退到 localStorage
- 如果 Firebase 可用，同时写入本地和云端

## 七、注意事项

1. **国内访问**：Firebase 在国内访问不稳定，建议使用国内 CDN 加速或改用国内服务（如 LeanCloud）
2. **安全规则**：上线前请配置 Firestore 安全规则，防止数据泄露
3. **配额限制**：Firebase 免费版有配额限制，高流量时需要升级付费方案
4. **数据迁移**：现有 localStorage 中的数据不会自动迁移到云端，需要手动导入