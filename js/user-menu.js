// 用户菜单组件

let userMenuContainer = null;
let isMenuOpen = false;

// 初始化用户菜单
function initUserMenu() {
    // 查找所有账号图标
    const accountIcons = document.querySelectorAll('[data-action="account"]');
    
    accountIcons.forEach((icon, index) => {
        // 移除旧的监听器（如果存在）
        icon.removeEventListener('click', handleAccountClick);
        
        // 添加新的监听器
        icon.addEventListener('click', handleAccountClick);
    });
    
    // 点击页面其他地方关闭菜单
    document.removeEventListener('click', handleDocumentClick);
    document.addEventListener('click', handleDocumentClick);
}

// 处理账号图标点击
function handleAccountClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // 如果已登录，显示下拉菜单
    if (window.UserManager && UserManager.isLoggedIn()) {
        toggleUserMenu(this);
    } else {
        // 未登录时跳转到账号页面
        window.location.href = 'account.html';
    }
}

// 处理页面点击（关闭菜单）
function handleDocumentClick(e) {
    if (isMenuOpen && userMenuContainer && !userMenuContainer.contains(e.target)) {
        closeUserMenu();
    }
}

// 创建用户菜单 - 取消头像显示
function createUserMenu(anchorElement) {
    // 如果菜单已存在，先移除
    if (userMenuContainer) {
        userMenuContainer.remove();
    }
    
    const user = UserManager.getUser();
    if (!user) return;
    
    // 创建菜单容器
    userMenuContainer = document.createElement('div');
    userMenuContainer.classList.add('user-menu');
    
    // 获取图标的位置
    const rect = anchorElement.getBoundingClientRect();
    
    // 设置菜单位置
    userMenuContainer.style.position = 'fixed';
    userMenuContainer.style.top = (rect.bottom + 8) + 'px';
    userMenuContainer.style.right = '24px';
    userMenuContainer.style.zIndex = '1000';
    
    // 创建菜单内容
    const content = document.createElement('div');
    content.classList.add('user-menu-content');
    
    // 创建头部（无头像）
    const header = document.createElement('div');
    header.classList.add('user-menu-header');
    
    const userInfo = document.createElement('div');
    userInfo.classList.add('user-info');
    
    const nickname = document.createElement('div');
    nickname.classList.add('user-nickname');
    nickname.textContent = user.nickname;
    
    const level = document.createElement('div');
    level.classList.add('user-level');
    level.textContent = user.levelName;
    
    userInfo.appendChild(nickname);
    userInfo.appendChild(level);
    header.appendChild(userInfo);
    content.appendChild(header);
    
    // 创建分隔线
    const divider1 = document.createElement('div');
    divider1.classList.add('user-menu-divider');
    content.appendChild(divider1);
    
    // 创建统计信息
    const stats = document.createElement('div');
    stats.classList.add('user-menu-stats');
    
    const expItem = document.createElement('div');
    expItem.classList.add('stat-item');
    const expLabel = document.createElement('span');
    expLabel.classList.add('stat-label');
    expLabel.textContent = 'EXP';
    const expValue = document.createElement('span');
    expValue.classList.add('stat-value');
    expValue.textContent = user.exp;
    expItem.appendChild(expLabel);
    expItem.appendChild(expValue);
    
    const gamesItem = document.createElement('div');
    gamesItem.classList.add('stat-item');
    const gamesLabel = document.createElement('span');
    gamesLabel.classList.add('stat-label');
    gamesLabel.textContent = '完成';
    const gamesValue = document.createElement('span');
    gamesValue.classList.add('stat-value');
    gamesValue.textContent = user.totalGames + '局';
    gamesItem.appendChild(gamesLabel);
    gamesItem.appendChild(gamesValue);
    
    stats.appendChild(expItem);
    stats.appendChild(gamesItem);
    content.appendChild(stats);
    
    // 创建分隔线
    const divider2 = document.createElement('div');
    divider2.classList.add('user-menu-divider');
    content.appendChild(divider2);
    
    // 创建操作按钮
    const actions = document.createElement('div');
    actions.classList.add('user-menu-actions');
    
    const goAccountBtn = document.createElement('button');
    goAccountBtn.classList.add('menu-action-btn');
    goAccountBtn.textContent = '账号设置';
    goAccountBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeUserMenu();
        window.location.href = 'account.html';
    });
    
    const logoutBtn = document.createElement('button');
    logoutBtn.classList.add('menu-action-btn', 'logout-btn');
    logoutBtn.textContent = '退出登录';
    logoutBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        UserManager.logout();
        closeUserMenu();
        window.location.reload();
    });
    
    actions.appendChild(goAccountBtn);
    actions.appendChild(logoutBtn);
    content.appendChild(actions);
    
    userMenuContainer.appendChild(content);
    
    // 添加样式
    addUserMenuStyles();
    
    // 添加到页面
    document.body.appendChild(userMenuContainer);
    
    // 添加显示动画
    setTimeout(() => {
        if (userMenuContainer) {
            userMenuContainer.classList.add('show');
        }
    }, 10);
}

// 切换菜单显示/隐藏
function toggleUserMenu(anchorElement) {
    if (isMenuOpen) {
        closeUserMenu();
    } else {
        createUserMenu(anchorElement);
        isMenuOpen = true;
    }
}

// 关闭菜单
function closeUserMenu() {
    if (userMenuContainer) {
        userMenuContainer.classList.remove('show');
        setTimeout(() => {
            if (userMenuContainer) {
                userMenuContainer.remove();
                userMenuContainer = null;
            }
        }, 200);
    }
    isMenuOpen = false;
}

// 添加菜单样式
function addUserMenuStyles() {
    const styleId = 'user-menu-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .user-menu {
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        
        .user-menu.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .user-menu-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 16px;
            min-width: 220px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .user-menu-header {
            margin-bottom: 12px;
        }
        
        .user-info {
            text-align: center;
        }
        
        .user-nickname {
            font-size: 18px;
            font-weight: 600;
            color: #333333;
        }
        
        .user-level {
            font-size: 14px;
            color: #FF7043;
            margin-top: 4px;
        }
        
        .user-menu-divider {
            height: 1px;
            background: rgba(0, 0, 0, 0.1);
            margin: 12px 0;
        }
        
        .user-menu-stats {
            display: flex;
            justify-content: space-around;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-label {
            display: block;
            font-size: 12px;
            color: #999999;
        }
        
        .stat-value {
            display: block;
            font-size: 18px;
            font-weight: 600;
            color: #333333;
        }
        
        .user-menu-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .menu-action-btn {
            width: 100%;
            padding: 10px 12px;
            border: none;
            border-radius: 8px;
            background: transparent;
            cursor: pointer;
            font-size: 14px;
            color: #333333;
            text-align: left;
            transition: background 0.2s;
            font-family: "Noto Sans SC", "Source Han Sans CN", "Microsoft YaHei", sans-serif;
        }
        
        .menu-action-btn:hover {
            background: rgba(0, 0, 0, 0.05);
        }
        
        .menu-action-btn.logout-btn {
            color: #E53935;
        }
        
        .menu-action-btn.logout-btn:hover {
            background: rgba(229, 57, 53, 0.1);
        }
    `;
    
    document.head.appendChild(style);
}

// 页面加载完成后初始化
function onPageLoad() {
    // 等待UserManager可用
    const checkUserManager = () => {
        if (window.UserManager) {
            UserManager.init();
            initUserMenu();
        } else {
            setTimeout(checkUserManager, 100);
        }
    };
    
    checkUserManager();
}

// 使用不同的方式确保初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onPageLoad);
} else {
    onPageLoad();
}

// 导出函数
window.UserMenu = {
    init: initUserMenu,
    close: closeUserMenu
};