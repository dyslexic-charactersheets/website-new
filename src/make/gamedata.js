import { loadAssets } from './gamedata-assets.js';
import { loadGame as loadGameLegacy } from './gamedata-legacy.js';
import { loadGame as loadGameLib, combineGames, getPageData as getPageDataLib } from './gamedata-lib.js';

import { error } from './util.js';

let assetsPromise = loadAssets();
let pf2promise = loadGameLib("pathfinder2");
let pf2remasterPromise = loadGameLib("pathfinder2remaster");
// let sf2promise = loadGameLib("starfinder2");

let pf1promise = loadGameLegacy("pathfinder");
let sf1promise = loadGameLegacy("starfinder");
let dnd35promise = loadGameLegacy("dnd35");

export function getPageData(gameData, language) {
  return getPageDataLib(gameData, language);
}

export function loadReady() {
    return Promise.all([
        pf2promise,
        pf2remasterPromise,
        // sf2promise,
        pf1promise,
        sf1promise,
        dnd35promise,
        assetsPromise,
    ]).then(([
      pf2data,
      pf2Rdata,
      // sf2data,
      pf1data,
      sf1data,
      dnd35data,
      assetData,
    ]) => {
      let pathfinder2 = combineGames([pf2data, pf2Rdata]);

      return {
        pathfinder2,
        pathfinder1: pf1data,
        starfinder1: sf1data,
        dnd35: dnd35data,
        assets: assetData
      }
    }).catch((e) => {
      error("gamedata", "Error reading game data", e);
    });
}
