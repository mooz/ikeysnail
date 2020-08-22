SOURCES = $(shell find src/ -type f -name '*.js') package/settings.default.js
PACKAGE = package/.output/ikeysnail.box

.PHONY: package
package: $(PACKAGE)

$(PACKAGE): $(SOURCES)
	npx webpack-cli --mode=production
	cd package; npx jsbox-cli build

release: $(PACKAGE)
	npx release-it
