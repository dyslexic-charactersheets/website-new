import { readFileSync } from 'fs';
import { resolve } from 'path';

import { log } from '#src/log.js';

let assetsDir = resolve('../../assets');
log("assets", "Assets dir", assetsDir);

export function setAssetsDir(dir) {
  assetsDir = resolve(dir);
  log("assets", "Assets dir", dir, "->", assetsDir);
}

export function getAssetPath(asset) {
  return resolve(assetsDir+'/'+asset);
}

export function loadAsset(asset) {
  let abs = getAssetPath(asset);
  log("assets", "Loading asset", abs);
  return readFileSync(abs);
}

export function loadAppAsset(asset) {
  let abs = resolve(`app/${asset}`);
  log("assets", "Loading app asset", abs);
  return readFileSync(abs);
}
