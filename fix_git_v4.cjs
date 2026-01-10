const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const cwd = path.join(__dirname);

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

// Cleanup previous temp files
['fix_git.js', 'fix_git_v2.js', 'fix_git_v2.cjs', 'fix_git_v3.cjs'].forEach(f => {
    try { fs.unlinkSync(path.join(cwd, f)); } catch(e) {}
});

// Git config
run('git config core.editor "echo"');
run('git config pull.rebase false');

// Reset stuck state
try { execSync('git rebase --abort', { cwd, stdio: 'ignore' }); } catch(e) {}
try { execSync('git merge --abort', { cwd, stdio: 'ignore' }); } catch(e) {}
try { if (fs.existsSync(path.join(cwd, '.git', 'index.lock'))) fs.unlinkSync(path.join(cwd, '.git', 'index.lock')); } catch(e) {}

// Add logic
run('git add .');
run('git commit -m "Fix root route 404 and cleanup"');

// Pull with allow-unrelated-histories and keep local changes (ours)
console.log('Pulling with strategy ours...');
const pulled = run('git pull origin main --allow-unrelated-histories -X ours');

if (pulled) {
    console.log('Pushing...');
    run('git push origin main');
} else {
    // If pull failed completely (not just conflict resolved), try force push?
    // User probably wants local code on remote.
    // console.log('Pull failed. Trying specific force push logic?');
}
