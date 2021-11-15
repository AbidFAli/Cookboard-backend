#!/usr/bin/env bash

sudo rm /etc/nginx/sites-available/default
sudo cp /opt/cookboard/back-end/scripts/production/nginx_config /etc/nginx/sites-available/default

STAT=$(sudo service nginx status)
if [[ "$STAT" =~ is[[:space:]]running ]]; then
  sudo nginx -s reload
fi