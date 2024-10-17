import { loadGame as loadGameLegacy } from './gamedata-legacy.js';
import { loadGame as loadGameLib } from './gamedata-lib.js';

import { error } from './util.js';

let pf2promise = loadGameLib("pathfinder2");
// let pf2remasterPromise = loadGameLib("pathfinder2r");
// let sf2promise = loadGameLib("starfinder2");

let pf1promise = loadGameLegacy("pathfinder");
let sf1promise = loadGameLegacy("starfinder");
let dnd35promise = loadGameLegacy("dnd35");


export function loadReady() {
    return Promise.all([
        pf2promise,
        // pf2remasterPromise,
        // sf2promise,
        pf1promise,
        sf1promise,
        dnd35promise,
    ]).then(([
      pf2data,
      // pf2Rdata,
      // sf2data,
      pf1data,
      sf1data,
      dnd35data,
    ]) => {
      return {
        pathfinder2: pf2data,
        // pathfinder2r: pf2Rdata,
        // starfinder2: sf2data,
        pathfinder1: pf1data,
        starfinder1: sf1data,
        dnd35: dnd35data,
      }
    }).catch((e) => {
      error("gamedata", "Error reading game data", e);
    });
}
