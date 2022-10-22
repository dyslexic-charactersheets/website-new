all: site serve

site:
	npm run make

run:
	npm run serve

debug:
	npm run debug
	
serve:
	@node_modules/.bin/light-server -s dist/htdocs/ -p 7000