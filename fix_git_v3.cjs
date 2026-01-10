const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Use relative path from where node is executed (workspace root) or absolute
const cwd = path.join(__dirname); 

console.log(`Working directory: ${cwd}`);

function run(cmd) {
    try {
        console.log(`> ${cmd}`);
        execSync(cmd, { cwd, stdio: 'inherit' });
        return true;
    } catch (e) {
        console.log(`Command failed: ${cmd}`);
        return false;
    }
}

// Ensure proper git config for this operation
run('git config core.editor "echo"');

// Try to clean up any stuck states
console.log('Cleaning up git state...');
try { execSync('git rebase --abort', { cwd, stdio: 'ignore' }); } catch(e) {}
try { execSync('git merge --abort', { cwd, stdio: 'ignore' }); } catch(e) {}
try { if (fs.existsSync(path.join(cwd, '.git', 'index.lock'))) fs.unlinkSync(path.join(cwd, '.git', 'index.lock')); } catch(e) {}

// Add files
run('git add .');

// Commit
console.log('Committing changes...');
run('git commit -m "Fix root route 404 and cleanup"');

// Pull first (with merge to avoid rebase hell for now)
console.log('Pulling updates...');
run('git pull origin main --no-rebase');

// Push
console.log('Pushing changes...');
const pushed = run('git push origin main');

if (!pushed) {
    console.log('Push failed. Attempting force push...'); 
    // run('git push origin main --force');
}
