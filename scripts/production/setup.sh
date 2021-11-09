#!/usr/bin/env bash
#Source: https://jasonwatmore.com/post/2019/11/18/react-nodejs-on-aws-how-to-deploy-a-mern-stack-app-to-amazon-ec2
echo "
----------------------
  NODE & NPM
----------------------
"


# add nodejs ppa (personal package archive) from nodesource
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -

# install nodejs and npm
sudo apt-get install -y nodejs

echo "
----------------------
  PM2
----------------------
"

# install pm2 with npm
sudo npm install -g pm2

# set pm2 to start automatically on system startup
sudo pm2 startup systemd


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

cd /opt/cookboard/back-end && sudo npm install

sudo pm2 start index.js

sudo git clone https://github.com/AbidFAli/Cookboard /opt/cookboard/front-end
cd /opt/cookboard/front-end && sudo npm install -y && sudo npm run build