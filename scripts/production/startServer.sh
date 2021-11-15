#!/usr/bin/env bash


#stop app if already started
#src: https://lifesaver.codes/answer/how-do-i-call-pm2-to-check-if-a-process-with-given-name-is-running
pm2 delete -s cookboard || :  

#start running the backend
pm2 start /opt/cookboard/back-end/index.js --name=cookboard 

sudo systemctl restart nginx #start ngingx
