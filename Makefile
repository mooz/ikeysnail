SOURCES = $(shell find src/ -type f -name '*.js')

package/.output/ikeysnail.box: $(SOURCES)
	npx webpack-cli --mode=production
	cd package; npx jsbox-cli build

# release: package/.output/ikeysnail.box
# 	npx release-it
