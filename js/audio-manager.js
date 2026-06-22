// 背景音乐管理器
class AudioManager {
    constructor() {
        this.audio = null;
        this.currentIndex = 0;
        this.isPlaying = false;
        this.volume = 0.1; // 默认音量10%
        this.currentTime = 0;
        this.autoPlayEnabled = true; // 是否启用自动播放
        this.hasUserGesture = false; // 是否已有用户手势
        this.shouldResumePlayback = false; // 是否需要恢复播放（跨页面）
        this.retryCount = 0; // 重试次数
        this.maxRetries = 5; // 最大重试次数
        
        // 歌曲列表 - 从 audio/ 文件夹自动加载
        this.songs = [
            { name: '2099我的机器女友', path: 'audio/2099我的机器女友.mp3' },
            { name: '一只慵懒的猫', path: 'audio/一只慵懒的猫.mp3' },
            { name: '上高速', path: 'audio/上高速.mp3' },
            { name: '不怕失去', path: 'audio/不怕失去.mp3' },
            { name: '危险老公', path: 'audio/危险老公.mp3' },
            { name: '同时', path: 'audio/同时.mp3' },
            { name: '哦妈妈', path: 'audio/哦妈妈.mp3' },
            { name: '大脑壳', path: 'audio/大脑壳.mp3' },
            { name: '好少年', path: 'audio/好少年.mp3' },
            { name: '小土墙', path: 'audio/小土墙.mp3' },
            { name: '小心他诡计多端', path: 'audio/小心他诡计多端.mp3' },
            { name: '开导', path: 'audio/开导.mp3' },
            { name: '想你来到我的世界里', path: 'audio/想你来到我的世界里.mp3' },
            { name: '我一直追随你的影', path: 'audio/我一直追随你的影.mp3' },
            { name: '拨号上网', path: 'audio/拨号上网.mp3' },
            { name: '拳手', path: 'audio/拳手.mp3' },
            { name: '摸鱼狂想曲', path: 'audio/摸鱼狂想曲.mp3' },
            { name: '既然已经不喜欢 就不要假装想靠近', path: 'audio/既然已经不喜欢 就不要假装想靠近.mp3' },
            { name: '棍子上的胡萝卜', path: 'audio/棍子上的胡萝卜.mp3' },
            { name: '没说一句', path: 'audio/没说一句.mp3' },
            { name: '滑翔', path: 'audio/滑翔.mp3' },
            { name: '漂泊成歌', path: 'audio/漂泊成歌.mp3' },
            { name: '现代英雄物语', path: 'audio/现代英雄物语.mp3' },
            { name: '相望', path: 'audio/相望.mp3' },
            { name: '老公又画了个饼', path: 'audio/老公又画了个饼.mp3' },
            { name: '老公经不起考验', path: 'audio/老公经不起考验.mp3' },
            { name: '老婆真危险', path: 'audio/老婆真危险.mp3' },
            { name: '菜鸡小叔', path: 'audio/菜鸡小叔.mp3' },
            { name: '设计院的工作好', path: 'audio/设计院的工作好.mp3' },
            { name: '超时空隧道', path: 'audio/超时空隧道.mp3' },
            { name: '足球小将', path: 'audio/足球小将.mp3' },
            { name: '软弱', path: 'audio/软弱.mp3' },
            { name: '铁公鸡之歌', path: 'audio/铁公鸡之歌.mp3' },
            { name: '靠近&靠近', path: 'audio/靠近&靠近.mp3' },
            { name: '靠近一点点', path: 'audio/靠近一点点.mp3' },
            { name: '鱼眼看世界', path: 'audio/鱼眼看世界.mp3' }
        ];
        
        this.init();
    }
    
    init() {
        // 从 localStorage 恢复播放状态
        const savedState = localStorage.getItem('audioState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.currentIndex = state.currentIndex || 0;
                this.isPlaying = state.isPlaying || false;
                this.currentTime = state.currentTime || 0;
                this.volume = state.volume !== undefined ? state.volume : 0.1;
                this.autoPlayEnabled = state.autoPlayEnabled !== undefined ? state.autoPlayEnabled : true;
                this.shouldResumePlayback = state.shouldResumePlayback || false;
            } catch (e) {
                console.error('Failed to parse audio state:', e);
            }
        }
        
        // 恢复用户手势状态（跨页面保持）
        const gestureSaved = localStorage.getItem('audioGesture');
        if (gestureSaved === 'true') {
            this.hasUserGesture = true;
        }
        
        // 创建音频对象
        this.createAudio();
        
        // 监听 storage 事件，同步其他页面的播放状态
        window.addEventListener('storage', (e) => {
            if (e.key === 'audioState') {
                try {
                    const state = JSON.parse(e.newValue);
                    this.syncState(state);
                } catch (e) {
                    console.error('Failed to sync audio state:', e);
                }
            }
        });
        
        // 页面关闭前保存状态
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
        
        // 监听用户手势（点击、触摸、键盘事件）
        this.setupUserGestureListeners();
    }
    
    setupUserGestureListeners() {
        const handleGesture = () => {
            if (!this.hasUserGesture) {
                this.hasUserGesture = true;
                localStorage.setItem('audioGesture', 'true');
                console.log('User gesture detected, enabling audio playback');
            }
        };
        
        document.addEventListener('click', handleGesture, { once: true });
        document.addEventListener('touchstart', handleGesture, { once: true });
        document.addEventListener('keydown', handleGesture, { once: true });
    }
    
    // 开始游戏时调用，随机播放一首音乐
    startGameMusic() {
        // 随机选择一首歌曲
        this.currentIndex = Math.floor(Math.random() * this.songs.length);
        this.currentTime = 0;
        this.createAudio();
        this.play();
    }
    
    createAudio() {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        
        const currentSong = this.songs[this.currentIndex];
        this.audio = new Audio(currentSong.path);
        this.audio.volume = this.volume;
        this.audio.loop = false; // 不循环，手动处理下一首
        
        // 歌曲结束后自动播放下一首
        this.audio.addEventListener('ended', () => {
            this.playNext();
        });
        
        // 播放位置更新时保存状态
        this.audio.addEventListener('timeupdate', () => {
            this.saveState();
        });
        
        // 加载失败时切换到下一首
        this.audio.addEventListener('error', (e) => {
            console.error('Audio load error:', e);
            this.playNext();
        });
    }
    
    play() {
        if (!this.audio) return;
        
        // 如果没有用户手势，记录需要播放但先不执行
        if (!this.hasUserGesture) {
            this.isPlaying = true;
            this.saveState();
            console.log('Audio will play after user gesture');
            return;
        }
        
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.shouldResumePlayback = true;
            this.saveState();
            console.log('Audio playing:', this.getCurrentSong().name);
        }).catch((e) => {
            console.error('Playback failed:', e);
            this.isPlaying = false;
        });
    }
    
    pause() {
        if (!this.audio) return;
        
        this.audio.pause();
        this.isPlaying = false;
        this.shouldResumePlayback = false;
        this.saveState();
        console.log('Audio paused');
    }
    
    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    playNext() {
        this.currentIndex = (this.currentIndex + 1) % this.songs.length;
        this.currentTime = 0;
        this.shouldResumePlayback = this.isPlaying;
        this.createAudio();
        this.play();
    }
    
    playPrev() {
        this.currentIndex = (this.currentIndex - 1 + this.songs.length) % this.songs.length;
        this.currentTime = 0;
        this.shouldResumePlayback = this.isPlaying;
        this.createAudio();
        this.play();
    }
    
    playRandom() {
        let newIndex = this.currentIndex;
        while (newIndex === this.currentIndex && this.songs.length > 1) {
            newIndex = Math.floor(Math.random() * this.songs.length);
        }
        this.currentIndex = newIndex;
        this.currentTime = 0;
        this.shouldResumePlayback = this.isPlaying;
        this.createAudio();
        this.play();
    }
    
    playAtIndex(index) {
        if (index >= 0 && index < this.songs.length) {
            this.currentIndex = index;
            this.currentTime = 0;
            this.shouldResumePlayback = this.isPlaying;
            this.createAudio();
            this.play();
        }
    }
    
    setVolume(value) {
        if (!this.audio) return;
        
        this.volume = Math.max(0, Math.min(1, value));
        this.audio.volume = this.volume;
        this.saveState();
    }
    
    setAutoPlay(enabled) {
        this.autoPlayEnabled = enabled;
        this.saveState();
    }
    
    saveState() {
        const state = {
            currentIndex: this.currentIndex,
            isPlaying: this.isPlaying,
            currentTime: this.audio ? this.audio.currentTime : 0,
            volume: this.volume,
            autoPlayEnabled: this.autoPlayEnabled,
            shouldResumePlayback: this.shouldResumePlayback
        };
        localStorage.setItem('audioState', JSON.stringify(state));
    }
    
    syncState(state) {
        if (state.volume !== this.volume) {
            this.setVolume(state.volume);
        }
        
        if (state.isPlaying !== this.isPlaying) {
            if (state.isPlaying) {
                this.isPlaying = true;
                this.play();
            } else {
                this.pause();
            }
        }
        
        if (state.autoPlayEnabled !== undefined && state.autoPlayEnabled !== this.autoPlayEnabled) {
            this.autoPlayEnabled = state.autoPlayEnabled;
        }
    }
    
    getCurrentSong() {
        return this.songs[this.currentIndex];
    }
    
    getState() {
        return {
            isPlaying: this.isPlaying,
            currentSong: this.getCurrentSong(),
            currentTime: this.audio ? this.audio.currentTime : 0,
            duration: this.audio ? this.audio.duration : 0,
            volume: this.volume,
            totalSongs: this.songs.length,
            currentIndex: this.currentIndex,
            autoPlayEnabled: this.autoPlayEnabled,
            hasUserGesture: this.hasUserGesture
        };
    }
}

// 创建全局实例
window.AudioManager = new AudioManager();