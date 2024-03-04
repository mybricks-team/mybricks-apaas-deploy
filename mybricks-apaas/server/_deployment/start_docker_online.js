const fs = require('fs-extra');
const path = require('path');
const mysql = require('mysql2');
const childProcess = require('child_process');


const EXTERNAL_FILE_STORAGE = path.join(__dirname, '../../')
let MYSQL_CONNECTION = null
let UserInputConfig = {};

const _execSqlSync = (sql) => {
  return new Promise((resolve, reject) => {
    MYSQL_CONNECTION.query(
      sql,
      function (err, results, fields) {
        if(!err) {
          resolve(true)
          return true
        } else {
          reject(err)
          return false
        }
      }
    );
  })
}

async function _initDatabaseTables() {
  let dirs = fs.readdirSync(path.join(__dirname, './sql'))
  for(let l = dirs?.length, i = 0; i < l; i++) {
    if(dirs[i] !== '.DS_Store') {
      const tableName = dirs?.[i]?.split('.')[0];
      const fullPath = path.join(__dirname, './sql', dirs[i]);
      const sqlStr = fs.readFileSync(fullPath, 'utf-8').toString();
      const temp = sqlStr.replace(/\n/g, '')
      // await _execSqlSync(`DROP TABLE IF EXISTS \`${tableName}\`;`)
      await _execSqlSync(temp)
    }
  }
  console.log(`【install】: 数据表初始化成功`)
}

async function _initDatabaseRecord() {
  const insertUser = `
    INSERT INTO \`${UserInputConfig.database.databaseName}\`.\`apaas_user\` (\`email\`, \`password\`, \`create_time\`, \`update_time\`, \`status\`, \`role\`) VALUES ('${UserInputConfig.adminUser.email}', '${Buffer.from(UserInputConfig.adminUser.password).toString('base64')}', ${Date.now()}, ${Date.now()}, 1, 10);
  `
  await _execSqlSync(insertUser)
  if(UserInputConfig.platformConfig) {
    console.log(`【install】: 检测到平台初始化配置`)
    const insertConfig = `
      INSERT INTO \`${UserInputConfig.database.databaseName}\`.\`apaas_config\` (\`config\`, \`app_namespace\`, \`create_time\`, \`update_time\`, \`creator_id\`, \`creator_name\`, \`updator_id\`, \`updator_name\`) VALUES ('${JSON.stringify(UserInputConfig.platformConfig)}', 'system', ${Date.now()}, ${Date.now()}, '${UserInputConfig.adminUser.email}', '${UserInputConfig.adminUser.email}', '${UserInputConfig.adminUser.email}', '${UserInputConfig.adminUser.email}');
    `
    await _execSqlSync(insertConfig)
  }
  console.log(`【install】: 数据记录初始化成功`)
}

async function _initDatabase() {
  await _execSqlSync(`create database IF NOT EXISTS \`${UserInputConfig.database.databaseName}\` default charset utf8mb4;`)
  await _execSqlSync(`use \`${UserInputConfig.database.databaseName}\`;`)
  console.log(`【install】: database ${UserInputConfig.database.databaseName}初始化成功并使用`)
}

function connectDB() {
  try {
    MYSQL_CONNECTION = mysql.createConnection({
      host: UserInputConfig.database.host,
      user: UserInputConfig.database.user,
      password: UserInputConfig.database.password,
      port: UserInputConfig.database.port
    });
  } catch(e) {
    console.log(e)
  }
  console.log(`【install】: 数据库连接成功：${JSON.stringify(UserInputConfig)}`)
}

function persistenceToConfig() {
  const folder = path.join(__dirname, '../config')
  if(!fs.existsSync(folder)) {
    fs.mkdirSync(folder)
  }
  const data = {
    "database": {
      "dbType": "MYSQL",
      "host": UserInputConfig.database.host,
      "user": UserInputConfig.database.user,
      "password": UserInputConfig.database.password,
      "port": UserInputConfig.database.port,
      "database": UserInputConfig.database.databaseName,
      "sqlPath": "."
    }
  }
  fs.writeFileSync(path.join(__dirname, '../config/default.json'), JSON.stringify(data), 'utf-8')
  fs.writeFileSync(path.join(__dirname, '../config/development.json'), JSON.stringify(data), 'utf-8')
  console.log(`【install】: 配置持久化成功`)
}

function mergeToApplication() {
  try {
    const appConfigPath = path.join(__dirname, '../application.json')
    let appConfig = {
      "installApps": [
        {
          "type": "oss",
          "version": "0.1.83",
          "namespace": "mybricks-material",
          "path": "asset-center/asset/app/mybricks-material/0.1.45/mybricks-material.zip"
        }
      ],
      "platformVersion": require(path.join(__dirname, '../package.json')).version
    };
  
    if(UserInputConfig.installApps) {
      console.log('[install] 检测到自定义安装应用，正在合并')
      appConfig.installApps = appConfig.installApps.concat(UserInputConfig.installApps)
    }
    fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2), 'utf-8')
    console.log('[install] 配置文件写入成功')
  } catch(e) {
    console.log('[install] mergeToApplication失败：' + e.message)
  }
}

function injectPLatformConfig() {
  const config = require(path.join(__dirname, '../ecosystem.config.js'))
  if(UserInputConfig.platformDomain) {
    config.apps[0].env.MYBRICKS_PLATFORM_ADDRESS = UserInputConfig.platformDomain
    config.apps[0].env.EXTERNAL_FILE_STORAGE = EXTERNAL_FILE_STORAGE
    config.apps[0].env.MYBRICKS_RUN_MODE = 'docker'
    config.apps[0].env.TZ = 'Asia/Shanghai'
    fs.writeFileSync(path.join(__dirname, '../ecosystem.config.js'), `module.exports = ${JSON.stringify(config)}`, 'utf-8')
  }
  console.log(`【install】: 初始化平台域名成功`)
}

function installApplication() {
  console.log(`【install】: 开始安装应用`)
  childProcess.execSync(`
    node installApplication.js
  `, {
    cwd: path.join(__dirname, '../'),
    stdio: 'inherit'
  })
  console.log(`【install】: 应用安装成功`)
}

async function startInstall() {
  injectPLatformConfig()
  connectDB()
  await _initDatabase()
  await _initDatabaseTables()
  await _initDatabaseRecord()
  persistenceToConfig()
  mergeToApplication()
}

async function startInstallServer() {
  const externalConfigPath = path.join(EXTERNAL_FILE_STORAGE, './external/PlatformConfig.json')
  if(fs.existsSync(externalConfigPath)) {
    console.log('[install] 已找到外部配置文件，将使用外部配置文件')
    try {
      let externalConfig = JSON.parse(fs.readFileSync(externalConfigPath, 'utf-8'))
      Object.assign(UserInputConfig, externalConfig)
      await startInstall()
    } catch(e) {
      console.log('[install] ' + e.message)
      exit()
    }
  } else {
    console.log('[install] 未找到外部配置文件，请确认路径是否正确')
    exit()
  }
}

function exit() {
  console.log(`【install】: 安装服务已退出`)
  process.exit(1)
}

function startService() {
  return new Promise((resolve) => {
    console.log(`【install】: 正在启动线上服务`)

    const nginxConf = path.join(__dirname, '../../nginx.conf')
    const childProcess = child_process.exec(`nginx -c ${nginxConf}`)
    setTimeout(async () => {
      try {
        console.log(`【install】: 转发服务启动成功`)
        childProcess.execSync(`
          npx pm2 start ecosystem.config.js --no-daemon
        `, {
          cwd: path.join(__dirname, '../'),
          stdio: 'inherit'
        })
        setTimeout(() => {
          console.log(`【install】: 线上服务启动成功，服务启动在 http://localhost:4100`)
          resolve()
        }, 3000)
      } catch(err) {
      }
    }, 100)
  })
}

async function start() {
  await startInstallServer()
  installApplication()
  await startService()
  exit()
}

start().then(() => {
  console.log('启动完成')
})
