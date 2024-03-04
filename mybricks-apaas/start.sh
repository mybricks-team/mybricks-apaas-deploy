#!/usr/bin/env bash
set -e

cd server
node installApplication.js
sleep 2
npx pm2 start ecosystem.config.js