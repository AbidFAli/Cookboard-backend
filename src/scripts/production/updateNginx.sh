#!/usr/bin/env bash

NGINX_PATH=/etc/nginx/sites-available/default
sudo rm $NGINX_PATH
sudo cp /opt/cookboard/back-end/scripts/production/nginx_config $NGINX_PATH

STAT=$(ps -e | grep nginx)
if [[ -n "$STAT" ]]; then
  sudo systemctl reload nginx
fi
