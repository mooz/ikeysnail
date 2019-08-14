#!/bin/bash

prettier --tab-width 2 --write 'src/**/*.js'
webpack --mode=production

cd package
jsbox build

PKG_FILE="package/.output/ikeysnail.box"

if [ ! -e $PKG_FILE ]; then
    echo "Finished!"
else
    echo "Oops"
    exit 1
fi
