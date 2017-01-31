#!/bin/bash
if [ $# -eq 0 ]
then
    echo "No arguments supplied. You need to pass path to config file as first argument like vc2_core/default_config.js"
else
    node scripts/make_combined_deps.js $1 --file bower.json
    echo "Running bower install"
    bower install
    node scripts/make_combined_deps.js $1 --file package.json
    echo "Running npm install"
    npm install
    scripts/restore_from_backup.sh bower.json
    scripts/restore_from_backup.sh package.json
fi
