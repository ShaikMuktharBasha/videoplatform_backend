const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname);

function run(cmd) {
    try {
        console.log(`> ${cmd}`);
        execSync(cmd, { cwd, stdio: 'inherit' });
    } catch (e) {
        console.log(`Command failed: ${cmd}`);
    }
}

// Reset lock
try { const fs = require('fs'); fs.unlinkSync(path.join(cwd, '.git', 'index.lock')); } catch(e) {}

run('git add .');
run('git commit -m "Add Like, Dislike, and Save video functionality"');
run('git pull origin main --rebase');
run('git push origin main');
