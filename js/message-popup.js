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

    init() {
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

    loadMessages() {
        this.messages = JSON.parse(localStorage.getItem('messages') || '[]');
        this.unreadCount = this.messages.filter(m => !m.read).length;
        this.updateBadge();
    }

    show() {
        this.loadMessages();
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
                    <p class="empty-hint">分享游戏后可在此查看编码记录</p>
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

        // 如果有完整编码，显示复制按钮
        const hasFullCode = msg.gameCode && msg.gameCode.length > 20;

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
                ${hasFullCode ? `
                    <div class="code-section">
                        <p class="code-label">完整编码：</p>
                        <textarea class="code-textarea" readonly>${msg.gameCode}</textarea>
                        <button class="copy-code-btn" id="copyFullCode">复制完整编码</button>
                    </div>
                ` : ''}
                <p class="message-detail-time">${msg.time}</p>
            </div>
        `;
        document.body.appendChild(detailPopup);

        // 复制编码按钮
        if (hasFullCode) {
            document.getElementById('copyFullCode')?.addEventListener('click', () => {
                navigator.clipboard.writeText(msg.gameCode).then(() => {
                    const btn = document.getElementById('copyFullCode');
                    btn.textContent = '已复制 ✓';
                    btn.style.background = '#4CAF50';
                    setTimeout(() => {
                        btn.textContent = '复制完整编码';
                        btn.style.background = '';
                    }, 2000);
                }).catch(() => {
                    const textarea = detailPopup.querySelector('.code-textarea');
                    textarea.select();
                    document.execCommand('copy');
                });
            });
        }

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

    deleteMessage(id) {
        this.messages = this.messages.filter(m => m.id !== id);
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