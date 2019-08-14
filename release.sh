#!/bin/bash

prettier --tab-width 2 --write 'src/**/*.js'
webpack --mode=production

cd package
jsbox build

PKG_FILE="package/.output/ikeysnail.box"

if [ ! -e $PKG_FILE ]; then
    echo "Finished creating the package."
    echo "Run $ npm run release"
else
    echo "Oops. Something went wrong."
    exit 1
fi
