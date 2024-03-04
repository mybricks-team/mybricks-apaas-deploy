#!/usr/bin/env bash
set -e
echo '正在安装依赖'
npm i --registry=https://registry.npmmirror.com
echo '依赖安装完毕'
echo '正在启动部署服务'
cd _deployment
node install.js
echo '部署完毕'