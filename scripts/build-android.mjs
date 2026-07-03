import { access, copyFile, mkdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '..');
const mode = process.argv[2] === 'release' ? 'release' : 'debug';

function run(command, args, cwd = root, env = process.env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('exit', code => code === 0
      ? resolvePromise()
      : reject(new Error(`${command} terminó con código ${code}`)));
  });
}

if (mode === 'release') {
  const required = [
    'MOBILE_API_URL',
    'ANDROID_KEYSTORE_PATH',
    'ANDROID_KEYSTORE_PASSWORD',
    'ANDROID_KEY_ALIAS',
    'ANDROID_KEY_PASSWORD',
  ];
  const missing = required.filter(name => !process.env[name]?.trim());
  if (missing.length > 0) {
    console.error(`Faltan variables para firmar el APK release: ${missing.join(', ')}`);
    process.exit(1);
  }
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
await run(npmCommand, ['run', 'cap:sync'], root, {
  ...process.env,
  MOBILE_RELEASE: mode === 'release' ? 'true' : 'false',
});

const gradle = process.platform === 'win32'
  ? resolve(root, 'android/gradlew.bat')
  : resolve(root, 'android/gradlew');
const task = mode === 'release' ? 'assembleRelease' : 'assembleDebug';
await run(gradle, [task, '--no-daemon', '--max-workers=2'], resolve(root, 'android'));

const apkName = mode === 'release' ? 'app-release.apk' : 'app-debug.apk';
const source = resolve(root, `android/app/build/outputs/apk/${mode}/${apkName}`);
await access(source, constants.R_OK);
const destinationDir = resolve(root, 'public/downloads');
const destination = resolve(destinationDir, 'sistema-electoral.apk');
await mkdir(destinationDir, { recursive: true });
await copyFile(source, destination);
const info = await stat(destination);
console.log(`APK ${mode} publicado en public/downloads/sistema-electoral.apk (${(info.size / 1024 / 1024).toFixed(2)} MB)`);
