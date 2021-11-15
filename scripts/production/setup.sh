#!/usr/bin/env bash
#Source: https://jasonwatmore.com/post/2019/11/18/react-nodejs-on-aws-how-to-deploy-a-mern-stack-app-to-amazon-ec2
echo "
----------------------
  NODE & NPM
----------------------
"
curl https://get.volta.sh | bash

source ~/.bashrc

#big note, can't use sudo npm with volta
volta install node@14

volta install npm@6

echo "
----------------------
  PM2
----------------------
"

# install pm2 with npm
npm install -g pm2

# set pm2 to start automatically on system startup
pm2 startup systemd


echo "
----------------------
  NGINX
----------------------
"

# install nginx
sudo apt-get install -y nginx


echo "
----------------------
  UFW (FIREWALL)
----------------------
"

# allow ssh connections through firewall
sudo ufw allow OpenSSH

# allow http & https through firewall
sudo ufw allow 'Nginx Full'

# enable firewall
sudo ufw --force enable

sudo git clone https://github.com/AbidFAli/Cookboard-backend /opt/cookboard/back-end

cd /opt/cookboard/back-end && sudo chown -R $(whoami) . && npm install

pm2 start index.js

sudo git clone https://github.com/AbidFAli/Cookboard /opt/cookboard/front-end
cd /opt/cookboard/front-end && sudo chown -R $(whoami) . && npm install

