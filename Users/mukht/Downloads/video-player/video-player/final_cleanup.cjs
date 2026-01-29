const fs = require('fs');
const path = require('path');
const cwd = __dirname;
['push_full_feature.cjs', 'push_player_fix.cjs', 'cleanup_lock.cjs', 'push_feature_v2.cjs'].forEach(f => {
    try { fs.unlinkSync(path.join(cwd, f)); } catch(e) {}
});
console.log('Cleanup complete');
