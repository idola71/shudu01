import { leancloudConfig } from './leancloud-config.js';

let AV = null;
let initialized = false;

export async function initLeanCloud() {
    if (initialized && AV) return AV;
    
    try {
        const { default: LeanCloud } = await import('https://unpkg.com/leancloud-storage@4.18.0/dist/av-min.js');
        AV = LeanCloud;
        
        AV.init({
            appId: leancloudConfig.appId,
            appKey: leancloudConfig.appKey,
            serverURL: leancloudConfig.serverURL
        });
        
        initialized = true;
        console.log('LeanCloud initialized successfully');
        return AV;
    } catch (error) {
        console.error('LeanCloud initialization failed:', error);
        return null;
    }
}

export async function getSharedGames() {
    await initLeanCloud();
    if (!AV) return [];
    
    try {
        const SharedGame = AV.Object.extend('SharedGame');
        const query = new AV.Query(SharedGame);
        query.descending('createdAt');
        
        const results = await query.find();
        const games = results.map(game => ({
            id: game.id,
            ...game.toJSON()
        }));
        
        return games;
    } catch (error) {
        console.error('Error fetching shared games:', error);
        return [];
    }
}

export async function addSharedGame(gameData) {
    await initLeanCloud();
    if (!AV) return null;
    
    try {
        const SharedGame = AV.Object.extend('SharedGame');
        const game = new SharedGame();
        
        Object.keys(gameData).forEach(key => {
            game.set(key, gameData[key]);
        });
        
        const result = await game.save();
        console.log('Game added with ID:', result.id);
        return result.id;
    } catch (error) {
        console.error('Error adding shared game:', error);
        return null;
    }
}

export async function updateSharedGame(gameId, updates) {
    await initLeanCloud();
    if (!AV) return false;
    
    try {
        const SharedGame = AV.Object.extend('SharedGame');
        const game = AV.Object.createWithoutData('SharedGame', gameId);
        
        Object.keys(updates).forEach(key => {
            game.set(key, updates[key]);
        });
        
        await game.save();
        console.log('Game updated:', gameId);
        return true;
    } catch (error) {
        console.error('Error updating shared game:', error);
        return false;
    }
}

export async function deleteSharedGame(gameId) {
    await initLeanCloud();
    if (!AV) return false;
    
    try {
        const SharedGame = AV.Object.extend('SharedGame');
        const game = AV.Object.createWithoutData('SharedGame', gameId);
        await game.destroy();
        
        console.log('Game deleted:', gameId);
        return true;
    } catch (error) {
        console.error('Error deleting shared game:', error);
        return false;
    }
}

export async function getLeaderboard(gameId) {
    await initLeanCloud();
    if (!AV) return [];
    
    try {
        const Leaderboard = AV.Object.extend('Leaderboard');
        const query = new AV.Query(Leaderboard);
        query.equalTo('gameId', gameId);
        query.ascending('errors');
        query.ascending('time');
        
        const results = await query.find();
        const records = results.map(record => ({
            id: record.id,
            ...record.toJSON()
        }));
        
        return records;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}

export async function addLeaderboardRecord(record) {
    await initLeanCloud();
    if (!AV) return null;
    
    try {
        const Leaderboard = AV.Object.extend('Leaderboard');
        const leaderboard = new Leaderboard();
        
        Object.keys(record).forEach(key => {
            leaderboard.set(key, record[key]);
        });
        
        const result = await leaderboard.save();
        console.log('Leaderboard record added:', result.id);
        return result.id;
    } catch (error) {
        console.error('Error adding leaderboard record:', error);
        return null;
    }
}

export async function getMessages(userId) {
    await initLeanCloud();
    if (!AV) return [];
    
    try {
        const Message = AV.Object.extend('Message');
        const query = new AV.Query(Message);
        
        if (userId && userId !== 'anonymous') {
            query.equalTo('userId', userId);
        } else {
            query.equalTo('userId', null);
        }
        
        query.descending('timestamp');
        
        const results = await query.find();
        const messages = results.map(message => ({
            id: message.id,
            ...message.toJSON()
        }));
        
        return messages;
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

export async function addMessage(message) {
    await initLeanCloud();
    if (!AV) return null;
    
    try {
        const Message = AV.Object.extend('Message');
        const msg = new Message();
        
        Object.keys(message).forEach(key => {
            msg.set(key, message[key]);
        });
        
        const result = await msg.save();
        console.log('Message added:', result.id);
        return result.id;
    } catch (error) {
        console.error('Error adding message:', error);
        return null;
    }
}

export async function updateMessage(messageId, updates) {
    await initLeanCloud();
    if (!AV) return false;
    
    try {
        const Message = AV.Object.extend('Message');
        const message = AV.Object.createWithoutData('Message', messageId);
        
        Object.keys(updates).forEach(key => {
            message.set(key, updates[key]);
        });
        
        await message.save();
        console.log('Message updated:', messageId);
        return true;
    } catch (error) {
        console.error('Error updating message:', error);
        return false;
    }
}

export async function deleteMessage(messageId) {
    await initLeanCloud();
    if (!AV) return false;
    
    try {
        const Message = AV.Object.extend('Message');
        const message = AV.Object.createWithoutData('Message', messageId);
        await message.destroy();
        
        console.log('Message deleted:', messageId);
        return true;
    } catch (error) {
        console.error('Error deleting message:', error);
        return false;
    }
}