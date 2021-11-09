#!/usr/bin/env bash

cd /opt/cookboard/front-end && git pull && sudo npm install -y && sudo npm run build
cd /opt/cookboard/back-end && git pull && sudo npm install