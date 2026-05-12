const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const distMain = path.join(root, 'dist', 'index.js');

if (!fs.existsSync(distMain)) {
  execSync('npm run build', { stdio: 'inherit', cwd: root });
}
