const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..');

const patterns = [
  /\/deal\//g,
  /\/deals\//g,
  /deal\.token/g,
  /deal_code/g,
  /deal\.id/g,
  /x-client-session-token/g,
  /localStorage.*delt_client_session/g,
  /router\.(push|replace)/g,
  /window\.location/g,
  /redirect\(/g,
  /deal_id/g
];

const results = {};

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'scratch' || entry.name.endsWith('.jpg') || entry.name.endsWith('.png')) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else {
      if (!fullPath.match(/\.(tsx|ts|js|jsx)$/)) continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = [];
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          matches.push(pattern.source);
        }
      }
      if (matches.length > 0) {
        results[fullPath.replace(srcDir, '')] = matches;
      }
    }
  }
}

scanDir(srcDir);
console.log(JSON.stringify(results, null, 2));
