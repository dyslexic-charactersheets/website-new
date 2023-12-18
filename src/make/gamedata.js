// import dyslexicCharacterSheets from 'dyslexic-charactersheets';
// import { sortBooks, book2img, book2tier } from './books.js';
// import { slugify } from './util.js';

import { loadGame as loadGameLegacy } from './gamedata-legacy.js';
import { loadGame as loadGameLib } from './gamedata-lib.js';

import { error } from './util.js';

/*

// prepare a select
function prepareSelect(select) {
    // group the values into books and tiers
    let tiers = {
        "core": [],
        "lore": [],
        "adventures": [],
        "thirdparty": []
    };

    for (let groupName in select.groups) {
        let id = slugify(groupName);
        let img = book2img('pf2', id);
        let tier = book2tier(groupName);

        let values = [];
        let groupValues = select.groups[groupName];
        for (let valueCode of groupValues) {
            for (let value of select.values) {
                if (value.code == valueCode) {
                    values.push(value);
                }
            }
        }

        if (values.length > 0) {
            let book = {
                id,
                name: groupName,
                img,
                selected: false,
                values,
            };

            tiers[tier].push(book);
        }
    }
    for (let tier in tiers) {
        tiers[tier] = sortBooks(tiers[tier]);
    }

    // select the first book with a real value
    // console.log(" * Tiers:", tiers);
    autoselect:
    for (let tierKey of ["core", "lore", "adventures", "thirdparty"]) {
        let tier = tiers[tierKey];
        for (let book of tier) {
            book.selected = true;
            break autoselect;
        }
    }
    // if (tiers.core.length > 0) {
    //     tiers.core[0].selected = true;
    // }
    select.tiers = tiers;

    return select;
}

function prepareGameData(gamedata) {
    // prepare all of the game's selects
    let selects = {};
    for (let select of gamedata.selects) {
        selects[select.select] = prepareSelect(select);
    }
    gamedata.selects = selects;

    return gamedata;
}

// embed selects
function embedSubSelects(gamedata) {
    // console.log(" * Embedding");
    for (let selectKey in gamedata.selects) {
        let select = gamedata.selects[selectKey];
        // console.log(" * Embedding in select", selectKey, select);
        for (let tierKey in select.tiers) {
            let tier = select.tiers[tierKey];
            for (let book of tier)  {
                // console.log("   * Embedding in book", book.name);
                for (let value of book.values) {
                    // console.log("     * Embedding in value", value.name);
                    if (value.hasOwnProperty('selects')) {
                        value.selects = value.selects.map((selectKey) => {
                            if (gamedata.selects.hasOwnProperty(selectKey)) {
                                // console.log("       * Embedding in subselect", selectKey);
                                return gamedata.selects[selectKey];
                            } else {
                                return null;
                            }
                        });
                    }
                }
            }
        }
    }

    return gamedata;
}

// pull out specific sub-selects
function extractSubSelects(gamedata, selectKeys) {
    gamedata.subselects = {};
    // console.log(" * Extracting");
    for (let selectKey of selectKeys) {
        let select = gamedata.selects[selectKey];
        gamedata.subselects[selectKey] = [];
        // console.log(" * Extracting from select", selectKey, select);
        for (let tierKey in select.tiers) {
            let tier = select.tiers[tierKey];
            for (let book of tier)  {
                // console.log("   * Extracting from book", book.name);
                for (let value of book.values) {
                    // console.log("     * Extracting from value", value.name);
                    if (value.hasOwnProperty('selects')) {
                        for (let subselect of value.selects) {
                            gamedata.subselects[selectKey].push(subselect);
                        }
                    }
                }
            }
        }
    }

    return gamedata;
}

export const pf2promise = dyslexicCharacterSheets.getFormData("pathfinder2").then((data) => {
    // separate out multiclass archetypes
    console.log(" * Selects:".yellow, data.selects.map((sel) => sel.select).sort());
    let outselects = [];
    for (let select of data.selects) {
        if (select.select == 'archetype') {
            console.log(" * Separating multiclass archetypes".blue, select);
            let multiclassSelect = {
                ...select,
                select: 'multiclass',
                name: 'Multiclass',
            };

            let multiclassValues = [];
            let archetypeValues = [];
            for (let value of select.values) {
                if (value.multiclass) {
                    multiclassValues.push(value);
                } else {
                    archetypeValues.push(value);
                }
            }
            console.log("   * Found: ".blue + multiclassValues.length + " multiclass and " + archetypeValues.length + " other archetypes");
            multiclassSelect.values = multiclassValues;
            select.values = archetypeValues;
            
            console.log("   * Multiclass select: ".blue, multiclassSelect);
            outselects.push(multiclassSelect);
            outselects.push(select);
        } else {
            outselects.push(select);
        }
    }
    data.selects = outselects;

    // make the selects
    console.log("   * Mid: ".blue + data.selects.filter((sel) => sel.select == 'archetype').map((sel) => sel.values.length) + " archetypes");
    let pathfinder2data = prepareGameData(data);
    console.log("   * After: ".blue + Object.keys(pathfinder2data.selects).join(", "));
    console.log("   * After: ".blue + pathfinder2data.selects.multiclass.values.length + " multiclass and " + pathfinder2data.selects.archetype.values.length + " other archetypes");
    
    // mark small ancestries
    for (let ancestry of pathfinder2data.selects.ancestry.values) {
        switch (ancestry.code) {
            case 'gnome':
            case 'goblin':
            case 'halfling':
            case 'apg-kobold':
            case 'apg-ratfolk':
            case 'lost-omens-ancestry-guide-sprite':
            case 'lost-omens-character-guide-leshy':
            case 'lost-omens-grand-bazaar-poppet':
                ancestry.small = true;
        }
    }

    // pull values into sub-selects for easy rendering
    pathfinder2data = embedSubSelects(pathfinder2data);

    // pull out the heritage and subclass selects
    extractSubSelects(pathfinder2data, ['ancestry', 'class']);

    return pathfinder2data;
});
*/

// export let pf2remasterPromise = dyslexicCharacterSheets.getFormData("pathfinder2r").then((data) => {

//   let pf2Rdata = {};

//   return pf2Rdata;
// });

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
