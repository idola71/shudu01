class MessagePopup {
    constructor() {
        this.popup = null;
        this.backdrop = null;
        this.messages = [];
        this.unreadCount = 0;
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.init();
    }

    async init() {
        this.createPopup();
        this.loadMessages();
        this.attachEvents();
    }

    createPopup() {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'message-backdrop';
        this.backdrop.style.display = 'none';
        document.body.appendChild(this.backdrop);

        this.popup = document.createElement('div');
        this.popup.className = 'message-popup';
        this.popup.style.display = 'none';
        this.popup.innerHTML = `
            <div class="message-header">
                <div class="header-content">
                    <img src="images/消息图标.svg" alt="消息">
                    <h2>站内信</h2>
                </div>
                <button class="close-btn" id="closeMessagePopup">✕</button>
            </div>
            <div class="message-body">
                <div class="message-list" id="messageList">
                </div>
            </div>
            <div class="message-footer">
                <button class="pagination-btn" id="prevPageBtn">←</button>
                <span class="pagination-info" id="paginationInfo">1/1</span>
                <button class="pagination-btn" id="nextPageBtn">→</button>
            </div>
        `;
        document.body.appendChild(this.popup);
    }

    attachEvents() {
        document.getElementById('closeMessagePopup')?.addEventListener('click', () => this.hide());
        this.backdrop.addEventListener('click', () => this.hide());
        document.getElementById('prevPageBtn')?.addEventListener('click', () => this.prevPage());
        document.getElementById('nextPageBtn')?.addEventListener('click', () => this.nextPage());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    async loadMessages() {
        let messages = [];
        
        try {
            const { initTCB, getMessages } = await import('./tcb-service.js');
            await initTCB();
            
            let userId = 'anonymous';
            if (window.UserManager && UserManager.isLoggedIn()) {
                const user = UserManager.getUser();
                userId = user?.id || user?.username || 'anonymous';
            }
            
            messages = await getMessages(userId);
        } catch (error) {
            console.error('TCB loadMessages error:', error);
        }
        
        if (messages.length === 0) {
            messages = JSON.parse(localStorage.getItem('messages') || '[]');
        } else {
            localStorage.setItem('messages', JSON.stringify(messages));
        }
        
        this.messages = messages;
        this.unreadCount = this.messages.filter(m => !m.read).length;
        this.updateBadge();
        this.updateSharedGameStats();
    }

    async updateSharedGameStats() {
        let sharedGames = [];
        
        try {
            const { initTCB, getSharedGames } = await import('./tcb-service.js');
            await initTCB();
            sharedGames = await getSharedGames();
        } catch (error) {
            console.error('TCB updateSharedGameStats error:', error);
        }
        
        if (sharedGames.length === 0) {
            sharedGames = JSON.parse(localStorage.getItem('sharedGames') || '[]');
        } else {
            localStorage.setItem('sharedGames', JSON.stringify(sharedGames));
        }
        
        let hasUpdates = false;
        this.messages.forEach(msg => {
            if (msg.gameId) {
                const game = sharedGames.find(g => g.id === msg.gameId || g._id === msg.gameId);
                if (game) {
                    if (msg.participants !== (game.participants || 0) || msg.completed !== (game.completed || 0)) {
                        msg.participants = game.participants || 0;
                        msg.completed = game.completed || 0;
                        msg.content = `您分享的数独游戏「${game.slogan || '未命名'}」已有 ${game.participants || 0} 人参与，${game.completed || 0} 人通关！`;
                        hasUpdates = true;
                    }
                }
            }
        });
        
        if (hasUpdates) {
            localStorage.setItem('messages', JSON.stringify(this.messages));
        }
    }

    show() {
        this.loadMessages();
        this.updateSharedGameStats();
        this.currentPage = 1;
        this.renderMessages();
        this.updatePagination();
        
        this.messages.forEach(msg => {
            msg.read = true;
        });
        this.unreadCount = 0;
        localStorage.setItem('messages', JSON.stringify(this.messages));
        this.updateBadge();

        this.backdrop.style.display = 'block';
        this.popup.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.backdrop.style.display = 'none';
        this.popup.style.display = 'none';
        document.body.style.overflow = '';
    }

    isVisible() {
        return this.popup.style.display === 'block';
    }

    renderMessages() {
        const messageList = document.getElementById('messageList');
        
        if (this.messages.length === 0) {
            messageList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>暂无消息</p>
                    <p class="empty-hint">完成游戏或分享作品可获得消息通知</p>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageMessages = this.messages.slice(startIndex, endIndex);

        messageList.innerHTML = pageMessages.map(msg => `
            <div class="message-item ${msg.read ? '' : 'unread'}">
                <img src="images/消息图标.svg" class="message-icon" alt="消息">
                <div class="message-content">
                    <div class="message-title">${msg.title}</div>
                    <div class="message-text">${msg.content}</div>
                    <div class="message-info-row">
                        ${msg.participants !== undefined ? `
                            <div class="message-stats">
                                <span><img src="images/参与人数图标.svg" alt="参与人数" class="message-stat-icon"> ${msg.participants} 参与</span>
                                <span><img src="images/通关人数图标.svg" alt="通关人数" class="message-stat-icon"> ${msg.completed} 通关</span>
                            </div>
                        ` : ''}
                        <div class="message-time">${msg.time}</div>
                    </div>
                </div>
                <button class="delete-btn" data-id="${msg.id}">✕</button>
            </div>
        `).join('');

        messageList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteMessage(e.target.dataset.id);
            });
        });

        messageList.querySelectorAll('.message-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn')) {
                    const msgId = item.querySelector('.delete-btn').dataset.id;
                    this.showMessageDetail(msgId);
                }
            });
        });
    }

    showMessageDetail(msgId) {
        const msg = this.messages.find(m => m.id === msgId);
        if (!msg) return;

        if (this.popup) {
            this.popup.style.pointerEvents = 'none';
            this.popup.style.filter = 'blur(3px) brightness(0.6)';
        }

        const detailBackdrop = document.createElement('div');
        detailBackdrop.className = 'message-backdrop';
        detailBackdrop.style.display = 'block';
        document.body.appendChild(detailBackdrop);

        const detailPopup = document.createElement('div');
        detailPopup.className = 'message-detail-popup';
        detailPopup.style.display = 'block';
        detailPopup.innerHTML = `
            <div class="message-detail-header">
                <h3>${msg.title}</h3>
                <button class="close-btn" id="closeDetailPopup">✕</button>
            </div>
            <div class="message-detail-body">
                <p class="message-detail-content">${msg.content}</p>
                ${msg.participants !== undefined ? `
                    <div class="message-detail-stats">
                        <span><img src="images/参与人数图标.svg" alt="参与人数" class="message-stat-icon"> ${msg.participants} 人参与</span>
                        <span><img src="images/通关人数图标.svg" alt="通关人数" class="message-stat-icon"> ${msg.completed} 人通关</span>
                    </div>
                ` : ''}
                <p class="message-detail-time">${msg.time}</p>
            </div>
        `;
        document.body.appendChild(detailPopup);

        const closeDetail = () => {
            detailBackdrop.remove();
            detailPopup.remove();
            if (this.popup) {
                this.popup.style.pointerEvents = 'auto';
                this.popup.style.filter = 'none';
            }
        };

        document.getElementById('closeDetailPopup')?.addEventListener('click', closeDetail);
        detailBackdrop.addEventListener('click', closeDetail);

        document.body.style.overflow = 'hidden';
    }

    async deleteMessage(id) {
        try {
            const { initTCB, deleteMessage } = await import('./tcb-service.js');
            await initTCB();
            
            const msg = this.messages.find(m => m.id === id || m._id === id);
            const tcbId = msg?._id || id;
            await deleteMessage(tcbId);
            console.log('TCB: Message deleted:', tcbId);
        } catch (error) {
            console.error('TCB deleteMessage error:', error);
        }

        this.messages = this.messages.filter(m => m.id !== id && m._id !== id);
        localStorage.setItem('messages', JSON.stringify(this.messages));
        
        const totalPages = Math.ceil(this.messages.length / this.itemsPerPage);
        if (this.currentPage > totalPages && this.currentPage > 1) {
            this.currentPage = totalPages;
        }
        
        this.renderMessages();
        this.updatePagination();
        this.updateBadge();
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderMessages();
            this.updatePagination();
        }
    }

    nextPage() {
        const totalPages = this.getTotalPages();
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderMessages();
            this.updatePagination();
        }
    }

    getTotalPages() {
        return Math.ceil(this.messages.length / this.itemsPerPage);
    }

    updatePagination() {
        const paginationInfo = document.getElementById('paginationInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const totalPages = this.getTotalPages();

        if (paginationInfo) {
            paginationInfo.textContent = `${this.currentPage}/${totalPages}`;
        }

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages;
        }
    }

    updateBadge() {
        const badge = document.querySelector('.message-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    }
}

function sendMessage(gameId, type = 'share', title = '游戏分享成功', content = '') {
    let userId = 'anonymous';
    let nickname = '匿名用户';
    
    if (window.UserManager && UserManager.isLoggedIn()) {
        const user = UserManager.getUser();
        userId = user?.id || user?.username || 'anonymous';
        nickname = user?.nickname || user?.username || '匿名用户';
    }

    const message = {
        id: Date.now().toString(),
        userId: userId,
        nickname: nickname,
        title: title,
        content: content || `您分享的数独游戏已发布到共创乐园！`,
        time: new Date().toLocaleString('zh-CN'),
        timestamp: Date.now(),
        read: false,
        type: type,
        gameId: gameId,
        participants: 0,
        completed: 0
    };

    (async function saveMessage() {
        try {
            const { initTCB, addMessage } = await import('./tcb-service.js');
            await initTCB();
            const tcbId = await addMessage(message);
            if (tcbId) {
                message._id = tcbId;
                const messages = JSON.parse(localStorage.getItem('messages') || '[]');
                const idx = messages.findIndex(m => m.id === message.id);
                if (idx !== -1) {
                    messages[idx]._id = tcbId;
                    localStorage.setItem('messages', JSON.stringify(messages));
                }
            }
            console.log('TCB: Message sent');
        } catch (error) {
            console.error('TCB sendMessage error:', error);
        }
    })();

    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    messages.unshift(message);
    localStorage.setItem('messages', JSON.stringify(messages));

    if (window.messagePopup) {
        window.messagePopup.loadMessages();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.messagePopup = new MessagePopup();
    
    const messageBtn = document.getElementById('messageBtn');
    if (messageBtn) {
        messageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.messagePopup.show();
        });
    }
});