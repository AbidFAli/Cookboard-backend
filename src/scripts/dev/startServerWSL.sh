#!/usr/bin/env bash

#stop app if already started
#src: https://lifesaver.codes/answer/how-do-i-call-pm2-to-check-if-a-process-with-given-name-is-running
pm2 delete -s cookboard || :  

#start running the backend
pm2 start /opt/cookboard/back-end/index.js --name=cookboard 


#if nginx is not running, then start it
STAT=$(sudo service nginx status)

#spaces are needed between the if and the [[ and also after the [[
#[:space:] == \s 
#posix character classes like space need to be enclosed in a []

if [[ "$STAT" =~ is[[:space:]]not[[:space:]]running ]]; then  
  sudo service nginx start
elif [[ "$STAT" =~ is[[:space:]]running ]]; then
  sudo nginx -s reload
fi


