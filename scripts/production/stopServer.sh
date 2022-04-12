#!/usr/bin/env bash

sudo pm2 delete cookboard
pm2 save
pm2 list
sudo systemctl stop nginx