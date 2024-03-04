#!/usr/bin/env bash
set -e
cd _deployment
node start_docker.js
echo "启动完毕"