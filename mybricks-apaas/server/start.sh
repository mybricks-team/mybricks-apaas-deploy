#!/usr/bin/env bash
set -e
npx pm2 kill
npx pm2 start ecosystem.config.js
echo "启动完毕"