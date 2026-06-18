# LeanCloud 云数据库集成配置指南

## 一、创建 LeanCloud 项目

1. 访问 [LeanCloud 控制台](https://console.leancloud.app/)
2. 点击"创建应用"
3. 输入应用名称，选择"开发版"（免费版足够）
4. 点击"创建"

## 二、获取 LeanCloud 配置

1. 在 LeanCloud 控制台点击应用名称进入
2. 点击左侧菜单"设置"→"应用 Key"
3. 复制以下配置信息：
   ```
   App ID: YOUR_APP_ID
   App Key: YOUR_APP_KEY
   REST API 服务器地址: YOUR_SERVER_URL
   ```

## 三、创建数据表（Class）

在 LeanCloud 控制台点击"存储"→"结构化数据"，创建以下三个 Class：

### 1. SharedGame（共享游戏）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| gameCode | String | 游戏编号 |
| puzzle | String | 完整谜题 |
| solution | String | 解答 |
| playerPuzzle | String | 玩家看到的谜题 |
| nickname | String | 分享者昵称 |
| username | String | 分享者用户名 |
| userId | String | 分享者用户ID |
| slogan | String | 游戏标语 |
| difficulty | String | 难度 |
| shareTime | String | 分享时间 |
| participants | Number | 参与人数 |
| completed | Number | 通关人数 |
| playerRecords | Object | 玩家记录 |

### 2. Leaderboard（排行榜）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| gameId | String | 游戏ID |
| name | String | 玩家昵称 |
| time | Number | 用时（秒） |
| errors | Number | 错误次数 |
| date | String | 日期 |

### 3. Message（消息）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| userId | String | 用户ID |
| nickname | String | 用户昵称 |
| title | String | 标题 |
| content | String | 内容 |
| time | String | 时间 |
| timestamp | Number | 时间戳 |
| read | Boolean | 是否已读 |
| type | String | 类型 |
| gameId | String | 关联游戏ID |
| participants | Number | 参与人数 |
| completed | Number | 通关人数 |

## 四、配置项目

### 方法一：使用配置脚本（推荐）

1. 编辑 `setup-leancloud.js` 文件，将配置信息填入 `config` 对象
2. 运行命令：
   ```bash
   node setup-leancloud.js
   ```

### 方法二：手动修改

修改 `public/js/leancloud-config.js` 文件：
```javascript
const leancloudConfig = {
    appId: "YOUR_APP_ID",
    appKey: "YOUR_APP_KEY",
    serverURL: "YOUR_SERVER_URL"
};
```

## 五、部署到 Vercel

1. 访问 [vercel.com](https://vercel.com) 登录
2. 点击"New Project"
3. 选择"Import Git Repository"或"Upload"
4. 上传项目文件夹
5. 点击"Deploy"

## 六、数据同步说明

### 本地存储兼容

项目采用本地存储与云端存储双备份策略：
- 如果 LeanCloud 不可用，自动回退到 localStorage
- 如果 LeanCloud 可用，同时写入本地和云端

## 七、注意事项

1. **国内访问**：LeanCloud 在国内有服务器，访问速度快
2. **安全规则**：上线前请配置 ACL 权限，防止数据泄露
3. **配额限制**：LeanCloud 免费版有配额限制，高流量时需要升级付费方案
4. **数据迁移**：现有 localStorage 中的数据不会自动迁移到云端，需要手动导入

## 八、项目文件结构

```
public/js/
├── leancloud-config.js       # LeanCloud 配置
├── leancloud-service.js      # LeanCloud 服务封装
├── paradise.js               # 共创乐园（使用 LeanCloud）
├── paradise-game.js          # 共创乐园游戏（使用 LeanCloud）
├── leaderboard.js            # 排行榜（使用 LeanCloud）
├── message-popup.js          # 站内信（使用 LeanCloud）
├── game.js                   # 趣味数独（分享到 LeanCloud）
├── custom-game.js            # 自定义游戏（分享到 LeanCloud）
├── custom-editor.js          # 编辑器（分享到 LeanCloud）
└── ...
```