const fs = require('fs');
const path = require('path');

const config = {
    env: "sudoku-copark-d9gvk8t5x3005140a-1444687386",
    region: "ap-shanghai"
};

const filesToUpdate = [
    'public/js/tcb-config.js'
];

function replaceConfig(content, config) {
    return content
        .replace(/env:\s*["']YOUR_ENV_ID["']/g, `env: "${config.env}"`)
        .replace(/region:\s*["']ap-guangzhou["']/g, `region: "${config.region}"`);
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
console.log('Remember to update the config object at the top of this file with your actual TCB credentials.');
console.log('\nTCB console: https://console.cloud.tencent.com/tcb');
console.log('Create three collections: sharedGames, leaderboard, messages');