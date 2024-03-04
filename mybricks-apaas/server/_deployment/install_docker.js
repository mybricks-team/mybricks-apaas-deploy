const fs = require('fs-extra');
const path = require('path');
const childProcess = require('child_process');

function mergeToApplication() {
  try {
    const appConfigPath = path.join(__dirname, '../application.json')
    let appConfig = {
      "installApps": [
        {
          "type": "oss",
          "version": "0.2.21",
          "namespace": "mybricks-material",
          "path": "asset-center/asset/app/mybricks-material/0.2.21/mybricks-material.zip"
        },
        {
          "type": "oss",
          "version": "1.2.74",
          "namespace": "mybricks-app-pcspa",
          "path": "asset-center/asset/app/mybricks-app-pcspa/1.2.74/mybricks-app-pcspa.zip"
        },
        {
          "type": "npm",
          "path": "mybricks-hainiu-login@0.0.4"
        },
        // {
        //   "type": "oss",
        //   "version": "0.0.8",
        //   "namespace": "mybricks-app-login",
        //   "path": "mybricks-app-login@0.0.5"
        // },
        {
          "type": "oss",
          "version": "1.0.46",
          "namespace": "mybricks-app-th5",
          "path": "asset-center/asset/app/mybricks-app-th5/1.0.46/mybricks-app-th5.zip"
        },
        {
          "type": "oss",
          "version": "0.0.94",
          "namespace": "mybricks-app-theme",
          "path": "asset-center/asset/app/mybricks-app-theme/0.0.94/mybricks-app-theme.zip"
        }
      ],
      "platformVersion": require(path.join(__dirname, '../package.json')).version
    };
  
    fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2), 'utf-8')
    console.log('[install] 配置文件写入成功')
    console.log('[install] 配置文件是', fs.readdirSync(path.join(__dirname, '../')))
  } catch(e) {
    console.log('[install] mergeToApplication失败：' + e.message)
  }
}

async function startInstall() {
  mergeToApplication()
}

async function startInstallServer() {
  try {
    await startInstall()
  } catch(e) {
    console.log('[install] ' + e.message)
    exit()
  }
}

function exit() {
  console.log(`【install】: 安装服务已退出`)
}

function installApplication() {
  console.log(`【install】: 开始安装应用`)
  childProcess.execSync(`
    node installApplication.js --appsFolder=/home/apaas/apps
  `, {
    cwd: path.join(__dirname, '../'),
    stdio: 'inherit'
  })
  console.log(`【install】: 应用安装成功`)
}


async function start() {
  console.log(`[install] 未安装，正在执行安装操作`)
  await startInstallServer()
  installApplication()
}

start().then(() => {})
