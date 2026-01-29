const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const cwd = path.join(__dirname);

function run(cmd) {
    try {
        console.log(`> ${cmd}`);
        execSync(cmd, { cwd, stdio: 'inherit' });
    } catch (e) {
        console.log(`Command failed: ${cmd}`);
    }
}

console.log('Pushing Like/Dislike/Save feature...');

run('git add backend/models/Video.js backend/models/User.js backend/controllers/videoActions.js backend/controllers/videoController.js backend/routes/videos.js');
run('git add frontend/src/services/api.js frontend/src/pages/VideoPlayer.jsx frontend/src/pages/LikedVideos.jsx frontend/src/pages/DislikedVideos.jsx frontend/src/pages/SavedVideos.jsx frontend/src/App.jsx');

run('git commit -m "Add Like, Dislike, and Save video functionality with sidebar pages"');

run('git pull origin main --rebase');

run('git push origin main');
