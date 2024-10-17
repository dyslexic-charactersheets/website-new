all: site run

site:
	npm run make

run:
	npm run serve

debug:
	npm run debug
	
static:
	@node_modules/.bin/light-server -s dist/htdocs/ -p 7000
