import { firebaseConfig } from './firebase-config.js';

let db = null;
let initialized = false;

export async function initFirebase() {
    if (initialized && db) return db;
    
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        initialized = true;
        console.log('Firebase initialized successfully');
        return db;
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        return null;
    }
}

export async function getSharedGames() {
    await initFirebase();
    if (!db) return [];
    
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const gamesRef = collection(db, 'sharedGames');
        const snapshot = await getDocs(gamesRef);
        
        const games = [];
        snapshot.forEach(doc => {
            games.push({ id: doc.id, ...doc.data() });
        });
        
        return games;
    } catch (error) {
        console.error('Error fetching shared games:', error);
        return [];
    }
}

export async function addSharedGame(gameData) {
    await initFirebase();
    if (!db) return null;
    
    try {
        const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const gamesRef = collection(db, 'sharedGames');
        const docRef = await addDoc(gamesRef, gameData);
        
        console.log('Game added with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding shared game:', error);
        return null;
    }
}

export async function updateSharedGame(gameId, updates) {
    await initFirebase();
    if (!db) return false;
    
    try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const gameRef = doc(db, 'sharedGames', gameId);
        await updateDoc(gameRef, updates);
        
        console.log('Game updated:', gameId);
        return true;
    } catch (error) {
        console.error('Error updating shared game:', error);
        return false;
    }
}

export async function deleteSharedGame(gameId) {
    await initFirebase();
    if (!db) return false;
    
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const gameRef = doc(db, 'sharedGames', gameId);
        await deleteDoc(gameRef);
        
        console.log('Game deleted:', gameId);
        return true;
    } catch (error) {
        console.error('Error deleting shared game:', error);
        return false;
    }
}

export async function getLeaderboard(gameId) {
    await initFirebase();
    if (!db) return [];
    
    try {
        const { collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const leaderboardRef = collection(db, 'leaderboard');
        const q = query(leaderboardRef, 
            where('gameId', '==', gameId),
            orderBy('errors', 'asc'),
            orderBy('time', 'asc')
        );
        const snapshot = await getDocs(q);
        
        const records = [];
        snapshot.forEach(doc => {
            records.push({ id: doc.id, ...doc.data() });
        });
        
        return records;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}

export async function addLeaderboardRecord(record) {
    await initFirebase();
    if (!db) return null;
    
    try {
        const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const leaderboardRef = collection(db, 'leaderboard');
        const docRef = await addDoc(leaderboardRef, record);
        
        console.log('Leaderboard record added:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding leaderboard record:', error);
        return null;
    }
}

export async function getMessages(userId) {
    await initFirebase();
    if (!db) return [];
    
    try {
        const { collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, 
            where('userId', '==', userId),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        return messages;
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

export async function addMessage(message) {
    await initFirebase();
    if (!db) return null;
    
    try {
        const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const messagesRef = collection(db, 'messages');
        const docRef = await addDoc(messagesRef, message);
        
        console.log('Message added:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding message:', error);
        return null;
    }
}

export async function updateMessage(messageId, updates) {
    await initFirebase();
    if (!db) return false;
    
    try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const messageRef = doc(db, 'messages', messageId);
        await updateDoc(messageRef, updates);
        
        console.log('Message updated:', messageId);
        return true;
    } catch (error) {
        console.error('Error updating message:', error);
        return false;
    }
}

export async function deleteMessage(messageId) {
    await initFirebase();
    if (!db) return false;
    
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const messageRef = doc(db, 'messages', messageId);
        await deleteDoc(messageRef);
        
        console.log('Message deleted:', messageId);
        return true;
    } catch (error) {
        console.error('Error deleting message:', error);
        return false;
    }
}