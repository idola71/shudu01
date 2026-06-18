const fs = require('fs');
const path = require('path');

const config = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const filesToUpdate = [
    'public/js/firebase-config.js',
    'public/js/firebase-service.js',
    'public/js/leaderboard.js',
    'public/js/paradise-game.js',
    'public/js/message-popup.js',
    'public/js/game.js',
    'public/js/custom-game.js',
    'public/js/custom-editor.js'
];

function replaceConfig(content, config) {
    return content
        .replace(/apiKey:\s*["']YOUR_API_KEY["']/g, `apiKey: "${config.apiKey}"`)
        .replace(/authDomain:\s*["']YOUR_AUTH_DOMAIN["']/g, `authDomain: "${config.authDomain}"`)
        .replace(/projectId:\s*["']YOUR_PROJECT_ID["']/g, `projectId: "${config.projectId}"`)
        .replace(/storageBucket:\s*["']YOUR_STORAGE_BUCKET["']/g, `storageBucket: "${config.storageBucket}"`)
        .replace(/messagingSenderId:\s*["']YOUR_SENDER_ID["']/g, `messagingSenderId: "${config.messagingSenderId}"`)
        .replace(/appId:\s*["']YOUR_APP_ID["']/g, `appId: "${config.appId}"`);
}

filesToUpdate.forEach(filePath => {
    try {
        const fullPath = path.join(__dirname, filePath);
        if (fs.existsSync(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const updatedContent = replaceConfig(content, config);
            fs.writeFileSync(fullPath, updatedContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        } else {
            console.log(`File not found: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error);
    }
});

console.log('\nConfiguration update complete!');
console.log('Remember to update the config object at the top of this file with your actual Firebase credentials.');