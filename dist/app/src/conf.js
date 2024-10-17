import { readFile } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';

import { log } from '#src/log.js';

// config
// load config from a YAML file

var config = {};

let confLoadPromise = new Promise((promiseResolve, promiseReject) => {
  const configFile = resolve('app/config.yml');
  log("conf", "Loading config file", configFile);
  readFile(configFile, (err, data) => {
    if (err) throw err;
    config = yaml.safeLoad(data);
    log("conf", "Loaded config");
    promiseResolve();
  });
});

export function conf(key) {
	if (config.hasOwnProperty(key))
		return config[key];
	return null;
}

export function onConfigLoaded(fn) {
  confLoadPromise.then(fn);
}
