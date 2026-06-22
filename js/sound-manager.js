// 音效管理器模块
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.volume = 0.1; // 默认音量10%
        this.enabled = true; // 音效开关
        
        // 初始化AudioContext
        this.initContext();
        
        // 绑定到window供全局使用
        window.SoundManager = this;
    }
    
    initContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    // 设置音量（0-1）
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }
    
    // 获取音量
    getVolume() {
        return this.volume;
    }
    
    // 设置音效开关
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    // 播放音效
    play(soundType) {
        if (!this.enabled || !this.audioContext) return;
        
        // 确保context处于运行状态
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        switch (soundType) {
            case 'click':
                this.playClick();
                break;
            case 'number':
                this.playNumber();
                break;
            case 'delete':
                this.playDelete();
                break;
            case 'note_add':
                this.playNoteAdd();
                break;
            case 'note_remove':
                this.playNoteRemove();
                break;
            case 'success':
                this.playSuccess();
                break;
            case 'error':
                this.playError();
                break;
            case 'menu_open':
                this.playMenuOpen();
                break;
            case 'menu_close':
                this.playMenuClose();
                break;
            case 'theme_change':
                this.playThemeChange();
                break;
            default:
                console.warn('Unknown sound type:', soundType);
        }
    }
    
    // 创建振荡器播放简单音调
    playTone(frequency, duration, type = 'sine', volume = 1) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // 音量包络
        const startTime = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * volume * 0.5, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }
    
    // 按钮点击音效
    playClick() {
        this.playTone(800, 0.08, 'sine', 0.5);
    }
    
    // 填入数字音效
    playNumber() {
        // 双音调，上升的感觉
        this.playTone(523.25, 0.1, 'sine', 0.4); // C5
        setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.5), 50); // E5
    }
    
    // 删除数字音效
    playDelete() {
        // 下降的音调
        this.playTone(523.25, 0.1, 'sine', 0.4); // C5
        setTimeout(() => this.playTone(392, 0.1, 'sine', 0.3), 30); // G4
    }
    
    // 添加笔记音效 - 单音调低频点击声
    playNoteAdd() {
        this.playTone(250, 0.15, 'sine', 0.9);
    }
    
    // 删除笔记音效
    playNoteRemove() {
        this.playTone(200, 0.15, 'sine', 0.5);
    }
    
    // 通关成功音效
    playSuccess() {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.4), i * 150);
        });
    }
    
    // 错误操作音效
    playError() {
        this.playTone(200, 0.15, 'triangle', 0.3);
        setTimeout(() => this.playTone(150, 0.2, 'triangle', 0.3), 150);
    }
    
    // 菜单展开音效
    playMenuOpen() {
        this.playTone(400, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(500, 0.15, 'sine', 0.3), 80);
    }
    
    // 菜单收起音效
    playMenuClose() {
        this.playTone(500, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(400, 0.15, 'sine', 0.3), 80);
    }
    
    // 主题切换音效
    playThemeChange() {
        this.playTone(600, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(800, 0.1, 'sine', 0.3), 60);
        setTimeout(() => this.playTone(1000, 0.15, 'sine', 0.4), 120);
    }
}

// 页面加载时初始化音效管理器
document.addEventListener('DOMContentLoaded', () => {
    new SoundManager();
});