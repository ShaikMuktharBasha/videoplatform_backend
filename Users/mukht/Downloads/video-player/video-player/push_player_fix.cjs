const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const cwd = path.join(__dirname, 'frontend');

function run(cmd) {
    try {
        console.log(`> ${cmd}`);
        execSync(cmd, { cwd, stdio: 'inherit' });
    } catch (e) {
        console.log(`Command failed: ${cmd}`);
    }
}

console.log('Pushing VideoPlayer fix...');

// Add specific file
run('git add src/pages/VideoPlayer.jsx');

// Commit
run('git commit -m "Fix video player playback source to use direct file URL"');

// Pull rebase just in case
run('git pull origin main --rebase');

// Push
run('git push origin main');
