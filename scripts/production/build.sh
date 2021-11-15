#!/usr/bin/env bash

cd /opt/cookboard/front-end && git pull && npm install -y && npm run build
cd /opt/cookboard/back-end && git pull && npm install

chmod +x scripts/production/updateNginx.sh
source scripts/production/updateNginx.sh