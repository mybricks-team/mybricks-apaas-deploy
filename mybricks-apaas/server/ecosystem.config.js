module.exports = {
  apps: [
    {
      name: "index",
      script: "./index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        "MYBRICKS_PLATFORM_ADDRESS": "",
        "MYBRICKS_PRIVATE_APP_STORE": true,
        "MYBRICKS_NODE_MODE": "slave",
        "MYBRICKS_RUN_MODE": "ecs",
        "TZ": "Asia/Shanghai"
      }
    }
  ]
}