#!/bin/bash

uglifyjs --comments -- scripts/content-script.js > scripts/content-script.min.js
# uglifyjs -- scripts/settings.js > scripts/settings.min.js

