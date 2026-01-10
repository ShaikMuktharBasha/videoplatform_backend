const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname);

function run(cmd) {
    try {
        execSync(cmd, { cwd, stdio: 'inherit' });
    } catch (e) {}
}

run('git rm fix_git.js');
run('git rm fix_git_v2.js');
run('git rm fix_git_v2.cjs');
run('git rm fix_git_v3.cjs');
run('git rm fix_git_v4.cjs');
run('git rm push_fix.cjs');

run('git commit -m "Cleanup temporary maintenance scripts"');
run('git push origin main');
