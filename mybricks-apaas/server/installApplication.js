const cp = require('child_process');
const fs = require('fs-extra');
const path = require('path')
const parse5 = require('parse5');
const mysql = require('mysql2');
const axios = require('axios');
const { APPS_BASE_FOLDER, NPM_REGISTRY, FILE_LOCAL_STORAGE_FOLDER } = require('./env');
const { injectAjaxScript, travelDom, injectAppConfigScript } = require('./util');

let npmRegistry = NPM_REGISTRY
let appsBaseFolder = APPS_BASE_FOLDER

if(process.argv) {
  process.argv.forEach((args) => {
    if(args.indexOf('--registry') !== -1) {
      npmRegistry = args.split('=')[1]
    }
    if(args.indexOf('--appsFolder') !== -1) {
      appsBaseFolder = args.split('=')[1]
    }
  })
}

let MYSQL_CONNECTION = null

function isYarnExist() {
  let result;
  try{
    cp.execSync('which yarn').toString()
    result = true
  } catch(e) {
    result = false
  }
  return result
}

async function installApplication() {
  return new Promise(async (resolve, reject) => {
    const applicationLoadConfigPath = path.join(process.cwd(), './application.json');
    if(fs.existsSync(applicationLoadConfigPath)) {
      const applicationLoadConfig = require(applicationLoadConfigPath)
      const installApps = applicationLoadConfig?.installApps
      for(let l = installApps.length, i = 0; i < l; i++) {
        const appConfig = installApps[i];
        let isScopePkg = false;
        if(appConfig.type === 'npm') {
          const npmPkg = appConfig.path;
          let pkgName;
          let rawPkgName;
          let pkgVersion;
          // scope package
          if(npmPkg[0] === '@') {
            const temPos = npmPkg.lastIndexOf('@');
            rawPkgName = npmPkg.substr(0, temPos)
            pkgName = encodeURIComponent(rawPkgName)
            pkgVersion = npmPkg.substr(temPos + 1)
            isScopePkg = true
          } else {
            pkgName = npmPkg.split('@')[0]
            rawPkgName = pkgName
            pkgVersion = npmPkg.split('@')[1]
          }
          if(!fs.existsSync(appsBaseFolder)) {
            fs.mkdirSync(appsBaseFolder)
          }
          const destAppDir = path.join(appsBaseFolder, `./${pkgName}`)
          if(!fs.existsSync(appsBaseFolder)) {
            fs.mkdirSync(appsBaseFolder)
          }
          
          // judge jump
          const existedAppPkgPath = path.join(destAppDir, './package.json')
          if(fs.existsSync(existedAppPkgPath)) {
            const existedAppPkg = require(existedAppPkgPath);
            if(existedAppPkg?.version === pkgVersion) {
              console.log(`【install】: 应用 ${npmPkg} 已安装，跳过...`)
              continue
            }
          }
          console.log(`【install】: 应用 ${npmPkg} 正在加载中...`)
          const tempFolder = destAppDir + '_temp';
          try{
            if(!fs.existsSync(tempFolder)) {
              fs.mkdirSync(tempFolder)
              fs.writeFileSync(tempFolder + '/package.json', JSON.stringify({}), 'utf-8')
            } else {
              fs.removeSync(tempFolder)
              fs.mkdirSync(tempFolder)
              fs.writeFileSync(tempFolder + '/package.json', JSON.stringify({}), 'utf-8')
            }
            if(isYarnExist()) {
              cp.execSync(`cd ${tempFolder} && yarn add ${npmPkg} --registry=${npmRegistry}  --production`, { stdio: 'inherit' })
            } else {
              cp.execSync(`cd ${tempFolder} && npm i --registry=${npmRegistry} ${npmPkg} --production`, { stdio: 'inherit' })
            }
          } catch(e) {
            console.log(`【install】: 应用 ${npmPkg} 安装失败，跳过...`)
            console.log(`【install】: 错误是: ${e.toString()}`)
            fs.removeSync(tempFolder)
            continue;
          }
          // copy aplication
          let srcAppDir;
          if(isScopePkg) { // scope package
            srcAppDir = path.join(tempFolder, `./node_modules/${rawPkgName}`)
          } else {
            srcAppDir = path.join(tempFolder, `./node_modules/${pkgName}`)
          }
          // 删除历史版本
          if(fs.existsSync(path.join(destAppDir, './assets'))) {
            fs.removeSync(path.join(destAppDir, './assets'))
          }
          if(fs.existsSync(path.join(destAppDir, './nodejs'))) {
            fs.removeSync(path.join(destAppDir, './nodejs'))
          }
          fs.copySync(srcAppDir, destAppDir)
          const pkgPath = path.join(destAppDir, './package.json');
          if(fs.existsSync(pkgPath)) {
            const pkg = require(pkgPath);
            if(typeof pkg === "object") {
              // copy xml
              const bePath = path.join(destAppDir, './nodejs')
              const fePath = path.join(destAppDir, './assets')
              if(fs.existsSync(bePath)) {
                // 存在后端
                if(fs.existsSync(path.join(bePath, './mapper'))) {
                  // 存在mapper
                  fs.copySync(path.join(bePath, './mapper'), path.join(process.cwd(), `./src/resource`))
                }
                // 移动依赖
                fs.moveSync(path.join(tempFolder, `./node_modules`), path.join(destAppDir, `./node_modules`), {overwrite: true})
              }
              if(fs.existsSync(fePath)) { // 存在前端
                if(pkg?.mybricks?.type !== 'system') { // 非系统任务
                  const feDirs = fs.readdirSync(fePath)
                  feDirs?.forEach(name => {
                    if(name.indexOf('.html') !== -1 && name !== 'preview.html' && name !== 'publish.html') {
                      // 默认注入所有的资源
                      const srcHomePage = path.join(fePath, name)
                      const rawHomePageStr = fs.readFileSync(srcHomePage, 'utf-8')
                      let handledHomePageDom = parse5.parse(rawHomePageStr);
                      travelDom(handledHomePageDom, {
                        ajaxScriptStr: injectAjaxScript({
                          namespace: pkg.name ? pkg.name : ''
                        }),
                        appConfigScriptStr: injectAppConfigScript({
                          namespace: pkg.name ? pkg.name : '',
                          version: pkg?.version,
                          ...(pkg?.mybricks || {})
                        }),
                        rawHtmlStr: rawHomePageStr,
                      })
                      let handledHomePageStr = parse5.serialize(handledHomePageDom)
                      fs.writeFileSync(srcHomePage, handledHomePageStr, 'utf-8')  
                    }
                  })
                  
                }
                console.log(`【install】: 资源准备完毕 ${npmPkg}`)
              }
              // exec hooks
              if(pkgPath?.mybricks?.preInstall) {
                prepareEnv()
                setTimeout(async () => {
                  await execJs({
                    jsPath: path.join(destAppDir, pkgPath.mybricks.preInstall)
                  })
                }, 100)
              }
            }
            fs.removeSync(tempFolder)
          }
        } else if(appConfig.type === 'oss') {
          const pkgVersion = appConfig.version;
          let pkgName = appConfig.namespace;
          if(!fs.existsSync(appsBaseFolder)) {
            fs.mkdirSync(appsBaseFolder)
          }
          const destAppDir = path.join(appsBaseFolder, `./${pkgName}`)
          
          // judge jump
          const existedAppPkgPath = path.join(destAppDir, './package.json')
          if(fs.existsSync(existedAppPkgPath)) {
            const existedAppPkg = require(existedAppPkgPath);
            if(existedAppPkg?.version === pkgVersion) {
              console.log(`【install】: 应用 ${pkgName} 已安装，跳过...`)
              continue
            }
          }
          console.log(`【install】: 应用 ${pkgName} 正在加载中...`)
          const tempFolder = destAppDir + '_temp';
          try{
            if(!fs.existsSync(tempFolder)) {
              fs.mkdirSync(tempFolder)
            } else {
              fs.removeSync(tempFolder)
              fs.mkdirSync(tempFolder)
            }
            const res = (await axios.post(
              'https://my.mybricks.world/central/api/channel/gateway', 
              // 'http://localhost:4100/central/api/channel/gateway', 
              {
              action: 'app_downloadByVersion',
              payload: JSON.stringify({
                namespace: pkgName,
                version: pkgVersion
              })
              })).data
            if(res.code !== 1) {
              console.log(`【install】: 应用 ${pkgName} 安装失败，跳过...`)
              console.log(`【install】: 错误是 ${res.msg}`)
              fs.removeSync(tempFolder)
              continue;
            } else {
              const tempPathZipFile = path.join(tempFolder, `${pkgName}.zip`)
              console.log(`[install]: 资源包下载成功 ${tempPathZipFile}}`)
              fs.writeFileSync(tempPathZipFile, Buffer.from(res.data.data));
              cp.execSync(`cd ${tempFolder} && unzip -o ${tempPathZipFile} -d ${destAppDir}`)
            }
          } catch(e) {
            console.log(`【install】: 应用 ${pkgName} 安装失败，跳过...`)
            console.log(`【install】: 错误是: ${e.toString()}`)
            fs.removeSync(tempFolder)
            continue;
          }
          // copy aplication
          let srcAppDir = path.join(destAppDir, `./${pkgName}`)
          let pkg;
          let bePath;
          let fePath;
          if(fs.existsSync(srcAppDir)) {
            pkg = require(path.join(srcAppDir, './package.json'));
            bePath = path.join(srcAppDir, './nodejs')
            fePath = path.join(srcAppDir, './assets')
            if(fs.existsSync(bePath)) {
              try{
                console.log(`开始安装依赖,请稍后 ${pkgName} ${npmRegistry}`)
                if(isYarnExist()) {
                  cp.execSync(`cd ${srcAppDir} && yarn install --prod --registry=${npmRegistry}`, { stdio: 'inherit' })
                } else {
                  cp.execSync(`cd ${srcAppDir} && npm i --registry=${npmRegistry} --production`, { stdio: 'inherit' })
                }
                // 移动依赖
                fs.moveSync(path.join(srcAppDir, `./node_modules`), path.join(destAppDir, `./node_modules`), {overwrite: true})
              } catch(e) {
                console.log(`【install】: 应用 ${pkgName} 安装失败，跳过...`)
                console.log(`【install】: 错误是: ${e.toString()}`)
                fs.removeSync(srcAppDir)
                fs.removeSync(tempFolder)
                continue;
              }
              // 存在后端
              if(fs.existsSync(path.join(bePath, './mapper'))) {
                // 存在mapper
                fs.copySync(path.join(bePath, './mapper'), path.join(process.cwd(), `./src/resource`))
              }
            }
            
            // copy xml
            if(fs.existsSync(fePath)) { // 存在前端
              if(pkg?.mybricks?.type !== 'system') { // 非系统任务
                const feDirs = fs.readdirSync(fePath)
                feDirs?.forEach(name => {
                  if(name.indexOf('.html') !== -1 && name !== 'preview.html' && name !== 'publish.html') {
                    // 默认注入所有的资源
                    const srcHomePage = path.join(fePath, name)
                    const rawHomePageStr = fs.readFileSync(srcHomePage, 'utf-8')
                    let handledHomePageDom = parse5.parse(rawHomePageStr);
                    travelDom(handledHomePageDom, {
                      ajaxScriptStr: injectAjaxScript({
                        namespace: pkg.name ? pkg.name : ''
                      }),
                      appConfigScriptStr: injectAppConfigScript({
                        namespace: pkg.name ? pkg.name : '',
                        version: pkg?.version,
                        ...(pkg?.mybricks || {})
                      }),
                      rawHtmlStr: rawHomePageStr,
                    })
                    let handledHomePageStr = parse5.serialize(handledHomePageDom)
                    fs.writeFileSync(srcHomePage, handledHomePageStr, 'utf-8')  
                  }
                })
                
              }
              console.log(`【install】: 资源准备完毕 ${pkgName}`)
            }

            // exec hooks
            if(pkg?.mybricks?.preInstall) {
              prepareEnv()
              setTimeout(async () => {
                await execJs({
                  jsPath: path.join(destAppDir, pkg.mybricks.preInstall)
                })
              }, 100)
            }
            // 删除历史版本
            if(fs.existsSync(path.join(destAppDir, './assets'))) {
              fs.removeSync(path.join(destAppDir, './assets'))
            }
            if(fs.existsSync(path.join(destAppDir, './nodejs'))) {
              fs.removeSync(path.join(destAppDir, './nodejs'))
            }
            fs.copySync(srcAppDir, destAppDir)
            console.log(`【install】: 依赖安装中,请稍后 ${pkgName}`)
            fs.removeSync(srcAppDir)
            fs.removeSync(tempFolder)
          }
        } else if(appConfig.type === 'local') {
          const pkgVersion = appConfig.version;
          let pkgName = appConfig.namespace;
          if(!fs.existsSync(appsBaseFolder)) {
            fs.mkdirSync(appsBaseFolder)
          }
          const destAppDir = path.join(appsBaseFolder, `./${pkgName}`)
          
          // judge jump
          const existedAppPkgPath = path.join(destAppDir, './package.json')
          if(fs.existsSync(existedAppPkgPath)) {
            const existedAppPkg = require(existedAppPkgPath);
            if(existedAppPkg?.version === pkgVersion) {
              console.log(`【install】: 应用 ${pkgName} 已安装，跳过...`)
              continue
            }
          }
          console.log(`【install】: 应用 ${pkgName} 正在加载中...`)
          const tempFolder = destAppDir + '_temp';
          try{
            if(!fs.existsSync(tempFolder)) {
              fs.mkdirSync(tempFolder)
            } else {
              fs.removeSync(tempFolder)
              fs.mkdirSync(tempFolder)
            }
            const tempPathZipFile = path.join(tempFolder, `${pkgName}.zip`)
            fs.copyFileSync(path.join(FILE_LOCAL_STORAGE_FOLDER, `./asset/app/${pkgName}/${pkgVersion}/${pkgName}.zip`), tempPathZipFile)
            cp.execSync(`cd ${tempFolder} && unzip -o ${tempPathZipFile} -d ${destAppDir}`)
          } catch(e) {
            console.log(`【install】: 应用 ${pkgName} 安装失败，跳过...`)
            console.log(`【install】: 错误是: ${e.toString()}`)
            fs.removeSync(tempFolder)
            continue;
          }
          // copy aplication
          let srcAppDir = path.join(destAppDir, `./${pkgName}`)
          let pkg;
          let bePath;
          let fePath;
          if(fs.existsSync(srcAppDir)) {
            pkg = require(path.join(srcAppDir, './package.json'));
            bePath = path.join(srcAppDir, './nodejs')
            fePath = path.join(srcAppDir, './assets')
            if(fs.existsSync(bePath)) {
              try{
                if(isYarnExist()) {
                  cp.execSync(`cd ${srcAppDir} && yarn --registry ${npmRegistry}  --production`, { stdio: 'inherit' })
                } else {
                  cp.execSync(`cd ${srcAppDir} && npm i --registry=${npmRegistry} --production`, { stdio: 'inherit' })
                }
                // 移动依赖
                fs.moveSync(path.join(srcAppDir, `./node_modules`), path.join(destAppDir, `./node_modules`), {overwrite: true})
              } catch(e) {
                console.log(`【install】: 应用 ${pkgName} 安装失败，跳过...`)
                console.log(`【install】: 错误是: ${e.toString()}`)
                fs.removeSync(srcAppDir)
                fs.removeSync(tempFolder)
                continue;
              }
              // 存在后端
              if(fs.existsSync(path.join(bePath, './mapper'))) {
                // 存在mapper
                fs.copySync(path.join(bePath, './mapper'), path.join(process.cwd(), `./src/resource`))
              }
            }
            
            // copy xml
            if(fs.existsSync(fePath)) { // 存在前端
              if(pkg?.mybricks?.type !== 'system') { // 非系统任务
                const feDirs = fs.readdirSync(fePath)
                feDirs?.forEach(name => {
                  if(name.indexOf('.html') !== -1 && name !== 'preview.html' && name !== 'publish.html') {
                    // 默认注入所有的资源
                    const srcHomePage = path.join(fePath, name)
                    const rawHomePageStr = fs.readFileSync(srcHomePage, 'utf-8')
                    let handledHomePageDom = parse5.parse(rawHomePageStr);
                    travelDom(handledHomePageDom, {
                      ajaxScriptStr: injectAjaxScript({
                        namespace: pkg.name ? pkg.name : ''
                      }),
                      appConfigScriptStr: injectAppConfigScript({
                        namespace: pkg.name ? pkg.name : '',
                        version: pkg?.version,
                        ...(pkg?.mybricks || {})
                      }),
                      rawHtmlStr: rawHomePageStr,
                    })
                    let handledHomePageStr = parse5.serialize(handledHomePageDom)
                    fs.writeFileSync(srcHomePage, handledHomePageStr, 'utf-8')  
                  }
                })
                
              }
              console.log(`【install】: 资源准备完毕 ${pkgName}`)
            }

            // exec hooks
            if(pkg?.mybricks?.preInstall) {
              prepareEnv()
              setTimeout(async () => {
                await execJs({
                  jsPath: path.join(destAppDir, pkg.mybricks.preInstall)
                })
              }, 100)
            }
            // 删除历史版本
            if(fs.existsSync(path.join(destAppDir, './assets'))) {
              fs.removeSync(path.join(destAppDir, './assets'))
            }
            if(fs.existsSync(path.join(destAppDir, './nodejs'))) {
              fs.removeSync(path.join(destAppDir, './nodejs'))
            }
            fs.copySync(srcAppDir, destAppDir)
            console.log(`【install】: 依赖安装中,请稍后 ${pkgName}`)
            fs.removeSync(srcAppDir)
            fs.removeSync(tempFolder)
          }
        }
      }
    }
    console.log(`【install】: 应用安装成功，可以启动 `)
    resolve()
  })
}

function prepareEnv() {
  if(!MYSQL_CONNECTION) {
    const dbConfig = require("./config/default.json");
    MYSQL_CONNECTION = mysql.createConnection({
      host: dbConfig.database.host,
      user: dbConfig.database.user,
      database: dbConfig.database.database,
      password: dbConfig.database.password,
      port: dbConfig.database.port
    });
    console.log(`【install】: 可执行环境准备完毕 `)
  }
}

const execSql = (sql) => {
  return new Promise((resolve, reject) => {
    MYSQL_CONNECTION.query(
      sql,
      function (err, results, fields) {
        if(!err) {
          // console.log(results);
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

const closeConnection = () => {
  if(MYSQL_CONNECTION && MYSQL_CONNECTION.end) {
    try {
      MYSQL_CONNECTION.end((err) => {
        if(err) {
          return console.log('数据库关闭失败:' + err.message);
        }
        console.log(`【install】: 数据库已释放 `)
      })
    } catch(e) {
      console.log(e)
    }
  }
}

async function execJs({ jsPath }) {
  const loadScript = require(jsPath)
  await loadScript({
    execSql: execSql
  })
}

function destroyEnv() {
  closeConnection();
  setTimeout(() => {
    MYSQL_CONNECTION = null;
    console.log(`【install】: 可执行环境已释放 `)
  }, 500)
}

installApplication()
  .then(() => {
    destroyEnv()
  })
  .catch(e => {
    console.log(e)
  })
