import { tcbConfig } from './tcb-config.js';

let db = null;
let initialized = false;

export async function initTCB() {
    if (initialized && db) return db;
    
    try {
        await loadTCBSDK();
        
        if (!window.tcb) {
            throw new Error('TCB SDK not loaded');
        }
        
        window.tcb.init({
            env: tcbConfig.env,
            region: tcbConfig.region
        });
        
        await window.tcb.auth({ persistence: 'local' }).signInAnonymously();
        console.log('TCB anonymous login successful');
        
        db = window.tcb.database();
        initialized = true;
        console.log('TCB initialized successfully');
        return db;
    } catch (error) {
        console.error('TCB initialization failed:', error);
        return null;
    }
}

function loadTCBSDK() {
    return new Promise((resolve, reject) => {
        if (window.tcb) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://imgcache.qq.com/qcloud/tcbjs/1.6.3/tcb.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load TCB SDK'));
        document.head.appendChild(script);
    });
}

export async function getSharedGames() {
    await initTCB();
    if (!db) return [];
    
    try {
        const result = await db.collection('sharedGames').orderBy('createdAt', 'desc').get();
        return result.data.map(doc => ({
            id: doc._id,
            _id: doc._id,
            ...doc
        }));
    } catch (error) {
        console.error('Error fetching shared games:', error);
        return [];
    }
}

export async function addSharedGame(gameData) {
    await initTCB();
    if (!db) return null;
    
    try {
        const result = await db.collection('sharedGames').add(gameData);
        console.log('Game added with ID:', result._id);
        return result._id;
    } catch (error) {
        console.error('Error adding shared game:', error);
        return null;
    }
}

export async function updateSharedGame(gameId, updates) {
    await initTCB();
    if (!db) return false;
    
    try {
        await db.collection('sharedGames').doc(gameId).update(updates);
        console.log('Game updated:', gameId);
        return true;
    } catch (error) {
        console.error('Error updating shared game:', error);
        return false;
    }
}

export async function deleteSharedGame(gameId) {
    await initTCB();
    if (!db) return false;
    
    try {
        await db.collection('sharedGames').doc(gameId).remove();
        console.log('Game deleted:', gameId);
        return true;
    } catch (error) {
        console.error('Error deleting shared game:', error);
        return false;
    }
}

export async function getLeaderboard(gameId) {
    await initTCB();
    if (!db) return [];
    
    try {
        const result = await db.collection('leaderboard')
            .where({ gameId: gameId })
            .orderBy('errors', 'asc')
            .orderBy('time', 'asc')
            .get();
        
        return result.data.map(doc => ({
            id: doc._id,
            ...doc
        }));
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}

export async function addLeaderboardRecord(record) {
    await initTCB();
    if (!db) return null;
    
    try {
        const result = await db.collection('leaderboard').add(record);
        console.log('Leaderboard record added:', result._id);
        return result._id;
    } catch (error) {
        console.error('Error adding leaderboard record:', error);
        return null;
    }
}

export async function getMessages(userId) {
    await initTCB();
    if (!db) return [];
    
    try {
        let query = db.collection('messages').orderBy('timestamp', 'desc');
        
        if (userId && userId !== 'anonymous') {
            query = query.where({ userId: userId });
        } else {
            query = query.where({ userId: null });
        }
        
        const result = await query.get();
        
        return result.data.map(doc => ({
            id: doc._id,
            ...doc
        }));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

export async function addMessage(message) {
    await initTCB();
    if (!db) return null;
    
    try {
        const result = await db.collection('messages').add(message);
        console.log('Message added:', result._id);
        return result._id;
    } catch (error) {
        console.error('Error adding message:', error);
        return null;
    }
}

export async function updateMessage(messageId, updates) {
    await initTCB();
    if (!db) return false;
    
    try {
        await db.collection('messages').doc(messageId).update(updates);
        console.log('Message updated:', messageId);
        return true;
    } catch (error) {
        console.error('Error updating message:', error);
        return false;
    }
}

export async function deleteMessage(messageId) {
    await initTCB();
    if (!db) return false;
    
    try {
        await db.collection('messages').doc(messageId).remove();
        console.log('Message deleted:', messageId);
        return true;
    } catch (error) {
        console.error('Error deleting message:', error);
        return false;
    }
}