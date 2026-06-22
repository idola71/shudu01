// 设置菜单组件
let settingsMenuContainer = null;

// 主题配置
const themes = {
    orange: {
        name: '暖阳橙',
        primary: '#FFA726',
        secondary: '#FF7043',
        gradient: 'linear-gradient(135deg, #FFA726 0%, #FF7043 100%)',
        textColor: '#FFFFFF'
    },
    blue: {
        name: '深海蓝',
        primary: '#1E88E5',
        secondary: '#1565C0',
        gradient: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
        textColor: '#FFFFFF'
    },
    purple: {
        name: '梦幻紫',
        primary: '#7E57C2',
        secondary: '#5E35B1',
        gradient: 'linear-gradient(135deg, #7E57C2 0%, #5E35B1 100%)',
        textColor: '#FFFFFF'
    },
    green: {
        name: '森林绿',
        primary: '#43A047',
        secondary: '#2E7D32',
        gradient: 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)',
        textColor: '#FFFFFF'
    },
    pink: {
        name: '樱花粉',
        primary: '#EC407A',
        secondary: '#D81B60',
        gradient: 'linear-gradient(135deg, #EC407A 0%, #D81B60 100%)',
        textColor: '#FFFFFF'
    },
    cyan: {
        name: '天空青',
        primary: '#00ACC1',
        secondary: '#00838F',
        gradient: 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)',
        textColor: '#FFFFFF'
    },
    dark: {
        name: '暗夜黑',
        primary: '#1a1a2e',
        secondary: '#16213e',
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        textColor: '#FFFFFF'
    }
};

function initSettingsMenu() {
    console.log('Initializing settings menu...');
    
    // 点击外部关闭菜单 - 使用捕获阶段，优先于其他事件
    document.addEventListener('click', function(e) {
        if (settingsMenuContainer && !settingsMenuContainer.contains(e.target)) {
            closeSettingsMenu();
        }
    }, true); // 使用捕获阶段
    
    // 初始化主题
    initTheme();
}

function toggleSettingsMenu(anchorElement) {
    console.log('toggleSettingsMenu called');
    console.log('settingsMenuContainer:', settingsMenuContainer);
    
    if (settingsMenuContainer) {
        console.log('Closing settings menu');
        // 播放菜单关闭音效
        if (window.SoundManager) {
            window.SoundManager.play('menu_close');
        }
        closeSettingsMenu();
        return;
    }
    
    console.log('Creating settings menu');
    // 播放菜单打开音效
    if (window.SoundManager) {
        window.SoundManager.play('menu_open');
    }
    createSettingsMenu(anchorElement);
}

function createSettingsMenu(anchorElement) {
    settingsMenuContainer = document.createElement('div');
    settingsMenuContainer.classList.add('settings-menu');
    
    // 获取图标的位置
    const rect = anchorElement.getBoundingClientRect();
    
    // 设置菜单位置
    settingsMenuContainer.style.position = 'fixed';
    settingsMenuContainer.style.top = (rect.bottom + 8) + 'px';
    settingsMenuContainer.style.right = '24px';
    settingsMenuContainer.style.zIndex = '1000';
    
    const content = document.createElement('div');
    content.classList.add('settings-menu-content');
    
    // === 游戏音乐音量控制 ===
    const audioVolumeControl = document.createElement('div');
    audioVolumeControl.classList.add('volume-control');
    
    const audioLabel = document.createElement('span');
    audioLabel.textContent = '游戏音乐';
    audioVolumeControl.appendChild(audioLabel);
    
    const audioSlider = document.createElement('input');
    audioSlider.type = 'range';
    audioSlider.min = '0';
    audioSlider.max = '100';
    audioSlider.value = window.AudioManager ? Math.round(window.AudioManager.volume * 100) : '10';
    audioSlider.addEventListener('input', function() {
        if (window.AudioManager) {
            window.AudioManager.setVolume(parseInt(this.value) / 100);
        }
    });
    audioVolumeControl.appendChild(audioSlider);
    content.appendChild(audioVolumeControl);
    
    // 分隔线
    const divider1 = document.createElement('div');
    divider1.classList.add('menu-divider');
    content.appendChild(divider1);
    
    // === 游戏音效音量控制 ===
    const soundVolumeControl = document.createElement('div');
    soundVolumeControl.classList.add('volume-control');
    
    const soundLabel = document.createElement('span');
    soundLabel.textContent = '游戏音效';
    soundVolumeControl.appendChild(soundLabel);
    
    const soundSlider = document.createElement('input');
    soundSlider.type = 'range';
    soundSlider.min = '0';
    soundSlider.max = '100';
    soundSlider.value = window.SoundManager ? Math.round(window.SoundManager.getVolume() * 100) : '10';
    soundSlider.addEventListener('input', function() {
        if (window.SoundManager) {
            window.SoundManager.setVolume(parseInt(this.value) / 100);
        }
    });
    soundVolumeControl.appendChild(soundSlider);
    content.appendChild(soundVolumeControl);
    
    // 分隔线
    const divider2 = document.createElement('div');
    divider2.classList.add('menu-divider');
    content.appendChild(divider2);
    
    // === 主题选择部分 ===
    // 主题标题
    const themeTitle = document.createElement('div');
    themeTitle.classList.add('settings-title');
    themeTitle.textContent = '选择主题';
    content.appendChild(themeTitle);
    
    // 主题列表
    const themeList = document.createElement('div');
    themeList.classList.add('theme-list');
    
    Object.entries(themes).forEach(([key, theme]) => {
        const themeItem = document.createElement('button');
        themeItem.classList.add('theme-item');
        themeItem.dataset.theme = key;
        
        // 主题颜色预览
        const colorPreview = document.createElement('div');
        colorPreview.classList.add('color-preview');
        colorPreview.style.background = theme.gradient;
        
        // 主题名称
        const themeName = document.createElement('span');
        themeName.classList.add('theme-name');
        themeName.textContent = theme.name;
        
        themeItem.appendChild(colorPreview);
        themeItem.appendChild(themeName);
        
        // 当前选中主题标记
        const currentTheme = localStorage.getItem('currentTheme') || 'orange';
        if (key === currentTheme) {
            themeItem.classList.add('selected');
        }
        
        themeItem.addEventListener('click', function() {
            applyTheme(key);
            closeSettingsMenu();
        });
        
        themeList.appendChild(themeItem);
    });
    
    content.appendChild(themeList);
    settingsMenuContainer.appendChild(content);
    document.body.appendChild(settingsMenuContainer);
    
    // 阻止菜单内部点击事件冒泡到document
    settingsMenuContainer.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // 添加显示动画
    setTimeout(() => {
        settingsMenuContainer.classList.add('show');
    }, 10);
}

function closeSettingsMenu() {
    if (settingsMenuContainer) {
        settingsMenuContainer.classList.remove('show');
        setTimeout(() => {
            settingsMenuContainer.remove();
            settingsMenuContainer = null;
        }, 200);
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('currentTheme') || 'orange';
    console.log('Initializing theme:', savedTheme);
    applyTheme(savedTheme);
}

function applyTheme(themeKey) {
    const theme = themes[themeKey];
    if (!theme) return;
    
    // 保存主题到localStorage
    localStorage.setItem('currentTheme', themeKey);
    
    // 更新CSS变量
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
    document.documentElement.style.setProperty('--theme-gradient', theme.gradient);
    
    // 更新body背景
    document.body.style.background = theme.gradient;
    
    // 更新所有header背景
    document.querySelectorAll('header, nav').forEach(el => {
        el.style.background = 'rgba(0, 0, 0, 0.1)';
    });
    
    console.log('Theme applied:', theme.name);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettingsMenu);
} else {
    // DOM已经加载完成，直接初始化
    initSettingsMenu();
}
