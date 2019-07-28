#!/bin/bash

prettier --write **/*.js
uglifyjs --comments -- strings/content-script.js > strings/content-script.min.js
# uglifyjs -- scripts/settings.js > scripts/settings.min.js
