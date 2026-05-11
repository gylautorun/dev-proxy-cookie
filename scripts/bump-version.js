#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');

function readPackageJson() {
  const content = fs.readFileSync(packageJsonPath, 'utf-8');
  return JSON.parse(content);
}

function writePackageJson(pkg) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
}

function bumpVersion(currentVersion, type = 'patch', prerelease = null) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z]+)\.(\d+))?$/;
  const match = currentVersion.match(semverRegex);
  
  if (!match) {
    console.error(`Invalid version format: ${currentVersion}`);
    process.exit(1);
  }
  
  let major = parseInt(match[1], 10);
  let minor = parseInt(match[2], 10);
  let patch = parseInt(match[3], 10);
  let currentPrerelease = match[4] || null;
  let prereleaseNum = parseInt(match[5], 10) || 0;
  
  // 如果是预发布版本（beta/alpha），保持版本号不变，只递增预发布编号
  if (prerelease) {
    if (currentPrerelease === prerelease) {
      // 同一预发布类型，递增预发布编号
      prereleaseNum++;
    } else {
      // 切换预发布类型，重置编号为1
      prereleaseNum = 1;
    }
    return `${major}.${minor}.${patch}-${prerelease}.${prereleaseNum}`;
  }
  
  // 正式版本升级逻辑
  switch (type) {
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor++;
      patch = 0;
      break;
    case 'patch':
    default:
      patch++;
      break;
  }
  
  // 如果当前是预发布版本，升级到正式版本时去掉预发布标记
  if (currentPrerelease) {
    return `${major}.${minor}.${patch}`;
  }
  
  return `${major}.${minor}.${patch}`;
}

function getVersionType() {
  const args = process.argv.slice(2);
  
  if (args.includes('--major')) return { type: 'major', prerelease: null };
  if (args.includes('--minor')) return { type: 'minor', prerelease: null };
  if (args.includes('--patch')) return { type: 'patch', prerelease: null };
  if (args.includes('--beta')) return { type: 'patch', prerelease: 'beta' };
  if (args.includes('--alpha')) return { type: 'patch', prerelease: 'alpha' };
  if (args.includes('--major-beta')) return { type: 'major', prerelease: 'beta' };
  if (args.includes('--minor-beta')) return { type: 'minor', prerelease: 'beta' };
  if (args.includes('--major-alpha')) return { type: 'major', prerelease: 'alpha' };
  if (args.includes('--minor-alpha')) return { type: 'minor', prerelease: 'alpha' };
  
  const env = process.env.npm_config_bump;
  if (env) {
    const prerelease = env.includes('beta') ? 'beta' : env.includes('alpha') ? 'alpha' : null;
    let type = 'patch';
    if (env.includes('major')) type = 'major';
    else if (env.includes('minor')) type = 'minor';
    return { type, prerelease };
  }
  
  return { type: 'patch', prerelease: null };
}

function main() {
  const pkg = readPackageJson();
  const currentVersion = pkg.version;
  const { type, prerelease } = getVersionType();
  const newVersion = bumpVersion(currentVersion, type, prerelease);
  
  pkg.version = newVersion;
  writePackageJson(pkg);
  
  const prereleaseLabel = prerelease ? ` (${prerelease})` : '';
  console.log(`Version bumped: ${currentVersion} → ${newVersion} (${type}${prereleaseLabel})`);
  
  process.exit(0);
}

main();
