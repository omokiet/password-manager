import type { Options } from '@wdio/types';
import * as os from 'os';
import * as path from 'path';

// Để chạy E2E, bạn cần build app trước: cargo tauri build
const appPath = path.join(process.cwd(), 'src-tauri', 'target', 'release', 'tauri-app.exe');

export const config: Options.Testrunner = {
    runner: 'local',
    specs: [
        './e2e/**/*.e2e.ts'
    ],
    maxInstances: 1,
    capabilities: [{
        maxInstances: 1,
        browserName: 'chrome', // Tauri Webview trên Windows dùng Edge (Chromium)
        'goog:chromeOptions': {
            binary: appPath,
            args: []
        }
    }],
    logLevel: 'error',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: [], // Require tauri-driver or chromedriver depending on setup
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
};
