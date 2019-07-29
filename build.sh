#!/bin/bash

prettier --tab-width 2 --write main.js
prettier --tab-width 2 --write **/*.js
uglifyjs --comments -- strings/content-script.js > strings/content-script.min.js
# uglifyjs -- scripts/settings.js > scripts/settings.min.js
