// 用户管理模块

const API_BASE = '';

let currentUser = null;

// EXP需求配置 - 基础等级
const LEVEL_CONFIG = {
    1: { exp: 0, name: 'Lv.1' },
    2: { exp: 100, name: 'Lv.2' },
    3: { exp: 300, name: 'Lv.3' },
    4: { exp: 600, name: 'Lv.4' },
    5: { exp: 1000, name: 'Lv.5' },
    6: { exp: 1500, name: 'Lv.6' },
    7: { exp: 2100, name: 'Lv.7' },
    8: { exp: 2800, name: 'Lv.8' },
    9: { exp: 3600, name: 'Lv.9' },
    10: { exp: 4500, name: 'Lv.10' }
};

// 难度对应的EXP奖励
const DIFFICULTY_EXP = {
    easy: 20,
    medium: 35,
    hard: 50,
    expert: 70
};

// 初始化用户
function initUser() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        // 更新等级名称为数字格式
        const levelInfo = calculateLevel(currentUser.exp);
        currentUser.level = levelInfo.level;
        currentUser.levelName = levelInfo.levelName;
        saveUser();
    }
}

// 获取当前用户
function getUser() {
    return currentUser;
}

// 检查是否已登录
function isLoggedIn() {
    return currentUser !== null;
}

// 注册账号
function register(username, password, nickname, defaultSlogan = '') {
    // 验证输入
    if (!username || !password || !nickname) {
        return { success: false, message: '账号、密码和昵称不能为空' };
    }
    
    if (username.length < 3 || username.length > 20) {
        return { success: false, message: '账号长度需在3-20字符之间' };
    }
    
    if (password.length < 6) {
        return { success: false, message: '密码长度至少6位' };
    }
    
    // 检查账号是否已存在
    const users = getUsers();
    if (users.some(u => u.username === username)) {
        return { success: false, message: '该账号已被注册' };
    }
    
    // 创建新用户
    const newUser = {
        id: Date.now().toString(),
        username,
        password: btoa(password), // 简单加密
        nickname,
        defaultSlogan,
        exp: 0,
        level: 1,
        levelName: 'Lv.1',
        completedGames: {
            easy: 0,
            medium: 0,
            hard: 0,
            expert: 0
        },
        totalGames: 0,
        createdAt: new Date().toLocaleString('zh-CN')
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    return { success: true, message: '注册成功', user: newUser };
}

// 登录
function login(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === btoa(password));
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, message: '登录成功', user };
    }
    
    return { success: false, message: '账号或密码错误' };
}

// 退出登录
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
}

// 获取所有用户
function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
}

// 计算等级 - 等级上不封顶，以数字显示
function calculateLevel(exp) {
    // 基础等级配置
    const levels = Object.keys(LEVEL_CONFIG).map(Number).sort((a, b) => a - b);
    const maxConfigLevel = levels[levels.length - 1];
    const maxConfigExp = LEVEL_CONFIG[maxConfigLevel].exp;
    
    // 如果EXP超过最高配置等级，继续计算
    if (exp >= maxConfigExp) {
        // 超过Lv.10后，每级需要额外1000 EXP递增
        const expBeyondMax = exp - maxConfigExp;
        const extraLevels = Math.floor(expBeyondMax / 1000);
        const level = maxConfigLevel + extraLevels;
        return { level, levelName: `Lv.${level}` };
    }
    
    // 使用配置表计算
    let level = 1;
    let levelName = 'Lv.1';
    
    for (const [lvl, config] of Object.entries(LEVEL_CONFIG)) {
        if (exp >= config.exp) {
            level = parseInt(lvl);
            levelName = config.name;
        }
    }
    
    return { level, levelName };
}

// 添加EXP
function addExp(expAmount) {
    if (!currentUser) return { success: false, message: '请先登录' };
    
    currentUser.exp += expAmount;
    
    // 检查升级
    const levelInfo = calculateLevel(currentUser.exp);
    const wasLevel = currentUser.level;
    
    if (levelInfo.level > currentUser.level) {
        currentUser.level = levelInfo.level;
        currentUser.levelName = levelInfo.levelName;
        
        saveUser();
        return { 
            success: true, 
            message: `恭喜！获得 ${expAmount} EXP，升级到 ${levelInfo.levelName}！`,
            levelUp: true,
            oldLevel: wasLevel,
            newLevel: levelInfo.level
        };
    }
    
    saveUser();
    return { success: true, message: `获得 ${expAmount} EXP` };
}

// 根据难度添加EXP
function addExpByDifficulty(difficulty) {
    const exp = DIFFICULTY_EXP[difficulty] || DIFFICULTY_EXP.medium;
    return addExp(exp);
}

// 保存用户数据
function saveUser() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 更新用户列表中的数据
        const users = getUsers();
        const index = users.findIndex(u => u.id === currentUser.id);
        if (index !== -1) {
            users[index] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
}

// 更新用户完成游戏数
function updateCompletedGames(difficulty) {
    if (!currentUser) return;
    
    currentUser.completedGames[difficulty] = (currentUser.completedGames[difficulty] || 0) + 1;
    currentUser.totalGames = (currentUser.totalGames || 0) + 1;
    saveUser();
}

// 获取用户等级名称
function getLevelName(level) {
    return LEVEL_CONFIG[level]?.name || `Lv.${level}`;
}

// 获取下一级所需EXP
function getExpToNextLevel() {
    if (!currentUser) return 0;
    
    const nextLevel = currentUser.level + 1;
    
    // 如果在下一个配置等级内
    if (LEVEL_CONFIG[nextLevel]) {
        return LEVEL_CONFIG[nextLevel].exp - currentUser.exp;
    }
    
    // 超过配置等级后，每级需要1000 EXP
    const maxConfigLevel = Object.keys(LEVEL_CONFIG).map(Number).sort((a, b) => b - a)[0];
    const maxConfigExp = LEVEL_CONFIG[maxConfigLevel].exp;
    const expBeyondMax = currentUser.exp - maxConfigExp;
    const currentThreshold = Math.floor(expBeyondMax / 1000) * 1000;
    
    return maxConfigExp + currentThreshold + 1000 - currentUser.exp;
}

// 获取当前等级所需总EXP
function getCurrentLevelExp(level) {
    if (LEVEL_CONFIG[level]) {
        return LEVEL_CONFIG[level].exp;
    }
    
    // 超过配置等级
    const maxConfigLevel = Object.keys(LEVEL_CONFIG).map(Number).sort((a, b) => b - a)[0];
    const maxConfigExp = LEVEL_CONFIG[maxConfigLevel].exp;
    
    if (level <= maxConfigLevel) {
        return LEVEL_CONFIG[level]?.exp || 0;
    }
    
    return maxConfigExp + (level - maxConfigLevel) * 1000;
}

// 更新默认标语
function updateDefaultSlogan(slogan) {
    if (!currentUser) return false;
    
    currentUser.defaultSlogan = slogan;
    saveUser();
    return true;
}

// 导出函数
window.UserManager = {
    init: initUser,
    getUser,
    isLoggedIn,
    register,
    login,
    logout,
    addExp,
    addExpByDifficulty,
    updateCompletedGames,
    getLevelName,
    getExpToNextLevel,
    getCurrentLevelExp,
    updateDefaultSlogan,
    LEVEL_CONFIG,
    DIFFICULTY_EXP
};