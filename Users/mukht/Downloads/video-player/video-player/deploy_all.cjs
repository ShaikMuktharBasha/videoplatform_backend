const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname);
const backend = path.join(root, 'backend');
const frontend = path.join(root, 'frontend');

function run(cmd, cwd) {
    try {
        console.log(`[${path.basename(cwd)}] > ${cmd}`);
        execSync(cmd, { cwd, stdio: 'inherit' });
    } catch (e) {
        console.log(`Command failed in ${path.basename(cwd)}: ${cmd}`);
    }
}

console.log('Deploying Backend...');
run('git add .', backend);
run('git commit -m "Implement Like/Dislike/Save APIs"', backend);
run('git pull origin main --rebase', backend);
run('git push origin main', backend);

console.log('Deploying Frontend...');
run('git add .', frontend);
run('git commit -m "Add Like/Dislike/Save UI and Pages"', frontend);
run('git pull origin main --rebase', frontend);
run('git push origin main', frontend);
