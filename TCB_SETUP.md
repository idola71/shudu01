# 腾讯云开发（TCB）集成配置指南

## 一、注册腾讯云账号

1. 访问 [cloud.tencent.com](https://cloud.tencent.com/)
2. 点击"免费注册"
3. 使用手机号或微信注册

## 二、实名认证

1. 登录后进入"账号中心"
2. 点击"实名认证"
3. 选择"个人认证"
4. 填写身份证信息
5. 行业信息：
   - 行业大类：`信息传输、软件和信息技术服务业`
   - 行业中类：`互联网和相关服务`
   - 行业小类：`游戏`
   - 用途：`个人项目/学习研究`

## 三、开通云开发环境

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 搜索"云开发 TCB"
3. 点击"立即使用"
4. 创建新环境：
   - 环境名称：如 `sudoku-game`
   - 地域：选择"广州"或"上海"
   - 计费模式：选择"免费体验版"（自动获得 3000 点/月资源点）
5. 等待环境创建完成（约 5 分钟）

## 四、获取环境配置

1. 在云开发控制台 → 概览
2. 记录以下信息：
   - **环境 ID**（类似 `sudoku-game-xxx`）
   - **环境域名**（类似 `sudoku-game-xxx.tcb.qcloud.la`）

## 五、创建数据库集合

在云开发控制台 → 数据库 → 创建集合：

### 1. sharedGames（共享游戏）
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

### 2. leaderboard（排行榜）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| gameId | String | 游戏ID |
| name | String | 玩家昵称 |
| time | Number | 用时（秒） |
| errors | Number | 错误次数 |
| date | String | 日期 |

### 3. messages（消息）
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

## 六、配置安全规则

在数据库 → 安全规则，设置为：
```javascript
{
  "read": true,
  "write": true
}
```

## 七、配置项目

### 方法一：使用配置脚本（推荐）

1. 编辑 `setup-tcb.js` 文件，将环境 ID 填入 `config` 对象：
   ```javascript
   const config = {
       env: "sudoku-game-xxx",
       region: "ap-guangzhou"
   };
   ```
2. 运行命令：
   ```bash
   node setup-tcb.js
   ```

### 方法二：手动修改

修改 `public/js/tcb-config.js` 文件：
```javascript
const tcbConfig = {
    env: "sudoku-game-xxx",
    region: "ap-guangzhou"
};
```

## 八、部署到 Vercel

1. 推送代码到 Git 仓库
2. 在 Vercel 导入项目
3. 部署完成

## 九、计费模式说明

### 资源点计费模式

腾讯云开发采用资源点计费模式，资源点和人民币换算比例为 **1000:1**。

### 免费体验版

| 资源 | 免费额度 |
|------|----------|
| 资源点 | 3000点/月 |
| 文档型数据库容量 | 按资源点消耗 |
| 数据库调用次数 | 按资源点消耗 |
| CDN 流量 | 按资源点消耗 |

### 资源点消耗标准

| 计费项 | 资源点消耗 | 实际价格 |
|--------|-----------|----------|
| 数据库调用次数 | 200点/万次 | 0.2元/万次 |
| 数据库容量 | 40点/GB/天 | 0.04元/GB/天 |
| 云存储读/写请求 | 10点/万次 | 0.01元/万次 |
| 云存储容量 | 3.94点/GB/天 | 0.00394元/GB/天 |
| CDN 流量 | 210点/GB | 0.21元/GB |

### 升级方案

当免费额度不够时，可升级到付费套餐：

| 套餐 | 价格 | 资源点/月 | 适合 |
|------|------|-----------|------|
| **免费体验版** | 0元 | 3000点 | 开发测试 |
| **个人版** | 19.9元（限时优惠） | 40,000点 | 个人项目 |
| **标准版** | 199元 | 330,000点 | 中小型应用 |

### 按量计费

- 免费体验版**暂不支持**开启按量计费
- 升级到付费套餐后，可在**套餐用量页**开启按量计费
- 扣费顺序：**套餐资源点 > 资源包 > 按量计费**

## 十、项目文件结构

```
public/js/
├── tcb-config.js             # TCB 配置
├── tcb-service.js            # TCB 服务封装
├── paradise.js               # 共创乐园（使用 TCB）
├── paradise-game.js          # 共创乐园游戏（使用 TCB）
├── leaderboard.js            # 排行榜（使用 TCB）
├── message-popup.js          # 站内信（使用 TCB）
├── game.js                   # 趣味数独（分享到 TCB）
├── custom-game.js            # 自定义游戏（分享到 TCB）
├── custom-editor.js          # 编辑器（分享到 TCB）
└── ...
```

## 十一、注意事项

1. **国内访问**：TCB 在国内有服务器，访问速度快
2. **安全规则**：上线前请配置 ACL 权限，防止数据泄露
3. **配额限制**：免费版有配额限制，高流量时需要升级付费方案
4. **数据迁移**：现有 localStorage 中的数据不会自动迁移到云端，需要手动导入
5. **免费环境限制**：免费体验版暂不支持按量计费、自定义域名、数据回档等功能
6. **到期续费**：免费环境单次支持续费 6 个月，到期前 1 个月内可以续费