const fs = require('fs');
const path = require('path');
try { fs.unlinkSync(path.join(__dirname, 'push_frontend.cjs')); } catch(e) {}
try { fs.unlinkSync(path.join(__dirname, 'fix_frontend_git.cjs')); } catch(e) {}
console.log('Cleanup done');
