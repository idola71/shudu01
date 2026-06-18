const fs = require('fs');
const path = require('path');

const config = {
    appId: "YOUR_APP_ID",
    appKey: "YOUR_APP_KEY",
    serverURL: "YOUR_SERVER_URL"
};

const filesToUpdate = [
    'public/js/leancloud-config.js'
];

function replaceConfig(content, config) {
    return content
        .replace(/appId:\s*["']YOUR_APP_ID["']/g, `appId: "${config.appId}"`)
        .replace(/appKey:\s*["']YOUR_APP_KEY["']/g, `appKey: "${config.appKey}"`)
        .replace(/serverURL:\s*["']YOUR_SERVER_URL["']/g, `serverURL: "${config.serverURL}"`);
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
console.log('Remember to update the config object at the top of this file with your actual LeanCloud credentials.');
console.log('\nLeanCloud console: https://console.leancloud.app/');
console.log('Create three classes: SharedGame, Leaderboard, Message');