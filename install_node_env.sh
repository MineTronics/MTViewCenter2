#!/bin/sh

#precondition is having installed git and cloned this Repo
if [ $(dpkg-query -W -f='${Status}' curl 2>/dev/null | grep -c "ok installed") -eq 0 ];
then
  sudo apt-get install curl;
fi

if [ $(dpkg-query -W -f='${Status}' nodejs 2>/dev/null | grep -c "ok installed") -eq 1 ];
then
  sudo apt-get remove nodejs;
fi

# install the nodejs package from nodesource.com
sudo curl -sL https://deb.nodesource.com/setup_5.x | sh -
sudo apt-get install --yes nodejs

# install envoronment web package manager and taskrunner as Globals
sudo npm install -g grunt-cli mocha bower

if [ $? -gt 0 ]
then
	echo "installation error, please check script install_noe_env.sh"
else 
	echo "installation complete. now run 'grunt' or 'grunt --no_auth'"
fi