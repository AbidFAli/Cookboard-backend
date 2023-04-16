# Cookboard-backend

Backend for [Cookboard](https://github.com/AbidFAli/Cookboard)

# Deploy

1. First Time setup  

`curl https://raw.githubusercontent.com/AbidFAli/Cookboard-backend/main/scripts/production/setup.sh | sudo bash`  

2. Build  

`cd /opt/cookboard/back-end`  
`./scripts/production/build.sh`  

3. Start Server  

Production:  

`./scripts/production/startServer.sh`  

WSL:  

`./scripts/dev/startServerWSL.sh`  


# Dev Setup

1. Create the .env file(NOT ON VERSION CONTROL)
2. Install volta
3. Install python


# HOWTO
  Run a script  
  `npm run run-script <script-path>`


# Credits

Some ideas and code modification from FullStackOpen(https://fullstackopen.com/en/) Chapters 2-5.
