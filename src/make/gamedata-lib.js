import dyslexicCharacterSheets from 'dyslexic-charactersheets';
import { has, slugify, log, warn, error } from './util.js';
import { languages, translate, de_i18n } from './i18n.js';
import { createSearchIndex } from './search.js';

// Combine multiple lib-based games
export function combineGames(games) {
  function combineArray(getter) {
    let values = new Set();
    for (let game of games) {
      let arr = getter(game);
      if (arr !== null && arr !== undefined && Array.isArray(arr)) {
        for (let item of arr) {
          values.add(item);
        }
      }
    }
    return [...values];
  }

  // combine the selects
  let selectKeys = new Set();
  for (let game of games) {
    let gameSelectKeys = Object.keys(game.selects);
    for (let key of gameSelectKeys) {
      selectKeys.add(key);
    }
  }
  let selects = {};
  for (let selectKey of selectKeys) {
    // get the various copies of this select
    let selectCopies = [];
    for (let game of games) {
      if (game.selects.hasOwnProperty(selectKey)) {
        let selectCopy = {
          ...game.selects[selectKey],
          edition: game.edition
        };
        selectCopies.push(selectCopy);
      }
    }

    let select = combineSelect(selectKey, selectCopies);
    // console.log(select);
    selects[selectKey] = select;
  }

  // combine the game metadata
  let combo = {
    selects,
    meta: {
      heritages: combineArray((g) => g.meta.heritages),
      subclasses: combineArray((g) => g.meta.subclasses),
      submulticlasses: combineArray((g) => g.meta.submulticlasses),
    }
  }

  // console.log("COMBINED");
  // console.log(combo);
  return combo;
}

function combineSelect(selectKey, selectCopies) {
  // console.log(selectKey, "- merging", selectCopies.length, "selects");
  let select = {
    ...selectCopies[0],
    values: [],
    edition: undefined
  };

  // combine the select values
  for (let selectCopy of selectCopies) {
    for (let value of selectCopy.values) {
      value.meta = {
        ...value.meta,
        edition: selectCopy.edition,
        select: selectKey,
        selects: value.selects,
      };
      select.values.push(value);
    }
  }

  // combine sub-selects?
  // let subselectKeys = new Set();
  // for (let value of select.values) {
  //   if ('selects' in value) {
  //     for (let subselectKey in value.selects) {
  //       subselectKeys.add(subselectKey);
  //     }
  //   }
  // }
  // console.log(selectKey, "- subselects:", subselectKeys);
  // for (let subselectKey of subselectKeys) {
  //   let subselectCopies = [];
  //   for (let selectCopy of selectCopies) {
      
  //   }
  //   combineSelect(subselectKey, subselectCopies);
  // }

  // fix up sub-selects
  for (let value of select.values) {
    if (has(value, 'subselects')) {
      for (let subselect of value.subselects) {
        subselect.displayGroups = groupSelectValues(subselect.values, subselect.select);
      }
    }
  }

  // finish the groups for display
  select.displayGroups = groupSelectValues(select.values, select.select);

  return select;
}





// Extract 
export function getPageData(gameData, language) {
  let selectKeys = Object.keys(gameData.selects);
  let names = {
    heritage: {}
  };
  for (let selectKey of selectKeys) {
    let select = gameData.selects[selectKey];
    let selectName = de_i18n(select.name);
    if (has(select, language) && has(select[language], "name")) {
      selectName = select[language].name;
    }

    names[selectKey] = {
      name: selectName
    };

    for (let value of select.values) {
      let valueName = de_i18n(value.name);
      if (has(value, language)) {
        valueName = value[language].name;
      }
      names[selectKey][value.id] = valueName;
    }
  }

  // special case: merge heritages
  for (let selectKey of selectKeys) {
    if (selectKey.startsWith('heritage/')) {
      names.heritage = {...names.heritage, ...names[selectKey]};
      delete names[selectKey];
    }
  }

  return {
    language,
    names,
    search: {},
  }
}


// Load a game system
export function loadGame(game) {
  return new Promise((resolve, reject) => {
    dyslexicCharacterSheets.getFormData(game).then((data) => {
      let languages = data.languages.map((lang) => lang.code);

      // get fixed selects
      let coreSelects = extractSelects(data, [
        "ancestry",
        "background",
        "class",
        "archetype",
      ]);
      
      // separate out multiclass archetypes
      if (coreSelects.archetype) {
        let [multiclassValues, archetypeValues] = splitValues(coreSelects.archetype.values, (item) => item.multiclass);
        coreSelects.multiclass = {
          select: "multiclass",
          name: "_{Multiclass}",
          max: 3,
          base: false,
          displayGroups: groupSelectValues(multiclassValues, coreSelects.archetype.groups, "multiclass"),
          values: multiclassValues
        };
        coreSelects.archetype = {
          ...coreSelects.archetype,
          displayGroups: groupSelectValues(archetypeValues, coreSelects.archetype.groups, "archetype"),
          values: archetypeValues
        };
      }

      // get variable selects
      let heritages = getSubSelects(coreSelects.ancestry, "ancestry");
      let subclasses = getSubSelects(coreSelects['class'], "class");
      let submulticlasses = getSubSelects(coreSelects.multiclass, "multiclass")
      let subarchetypes = getSubSelects(coreSelects.archetype, "archetype");

      let heritageSelects = extractSelects(data, [
        ...heritages,
        "heritage/versatile",
      ]);

      let moreSelects = extractSelects(data, [
        ...subclasses,
        ...submulticlasses,
        ...subarchetypes,
      ]);

      // put them together
      let gamedata = {
        edition: data.edition,
        selects: {...coreSelects, ...heritageSelects, ...moreSelects}
      };
      let selectKeys = Object.keys(gamedata.selects);

      // embed subselects
      for (let selectKey of selectKeys) {
        for (let value of gamedata.selects[selectKey].values) {
          if (has(value, "selects")) {
            value.subselects = Object.values(extractSelects(data, value.selects));
          }
        }
      }

      // prepare translations
      // for (let selectKey of selectKeys) {
      //   prepareTranslations(gamedata.selects[selectKey], ['name'], languages);
      //   for (let value of gamedata.selects[selectKey].values) {
      //     prepareTranslations(value, ['group', 'name'], languages);
      //     if (has(value, "subselects")) {
      //       for (let subselect of value.subselects) {
      //         prepareTranslations(subselect, ['name'], languages);
      //       }
      //     }
      //   }
      // }

      // prepare metadata
      for (let selectKey of selectKeys) {
        prepareSelectMetadata(gamedata.selects[selectKey]);
      }

      // note other information
      gamedata.meta = {
        heritages,
        subclasses,
        submulticlasses,
      };

      resolve(gamedata);
    });
  });
}

function getSubSelects(select, name) {
  if (select === undefined || select === null) {
    warn("gamedata-lib", "Cannot find select".red, name);
    return [];
  }
  return select.values.map((value) => {
    if (!has(value, "selects")) {
      return [];
    }
    return value.selects;
  }).flat();
}

function splitValues(list, condition) {
  let left = [];
  let right = [];
  for (let item of list) {
    if (condition(item)) {
      left.push(item);
    } else {
      right.push(item);
    }
  }
  return [left, right];
}

function extractSelects(basedata, extractSelects, opts = {}) {

  let outdata = {
    // base: basedata,
  };

  // grab all the selects
  for (let select of basedata.selects) {
    if (extractSelects.includes(select.select)) {
      // select.displayGroups = groupSelectValues(select.values, select.groups, select.select);
      outdata[select.select] = select;
    }
  }

  return outdata;
}

function groupSelectValues(values, name) {
  let valuesById = {};
  let groupNames = new Set();
  for (let value of values) {
    value.select = name;
    valuesById[value.id] = value;
    valuesById[value.code] = value;
    let slugId = slugify(value.id);
    valuesById[slugId] = value;
    let shortId = value.id.replace(/^.*\//, '');
    valuesById[shortId] = value;
    groupNames.add(value.group);
  }

  // embed values into groups
  // console.log("Group names", groupNames);
  let groups = {};
  for (let groupName of groupNames) {
    groups[groupName] = [];
  }

  // console.log("Empty groups", groups);

  for (let value of values) {
    // console.log("Putting in a group", value);
    groups[value.group].push(value);
  }

  // put groups in tiers
  let tiers = {
    "core1": [],
    "core2": [],
    "rulebooks": [],
    "expansions": [],
    "adventures": [],
    "thirdparty": []
  };
  for (let groupName of groupNames) {
    if (groups[groupName].length > 0) {
      let tier = group2tier(groupName, false);
      tiers[tier].push({
        group: groupName,
        values: groups[groupName],
      });
    }
  }

  // sort the groups in each tier
  // TODO translations?
  // for (let tier of tiers) {
  //   tier.sort((a, b) => ('' + a.group).localeCompare(b.group));
  // }


  // console.log("   * Tiers".green);
  // for (let tier in tiers) {
  //   console.log(("     * "+tier).green, tiers[tier]);
  // }

  // accumulate the groups in one list
  return [...tiers.core1, ...tiers.core2, ...tiers.rulebooks, ...tiers.expansions, ...tiers.adventures, ...tiers.thirdparty];
}

function prepareSelectMetadata(select) {
  for (let value of select.values) {
    prepareValueMetadata(value);
  }
}

function prepareValueMetadata(value) {
  value.meta = {
    select: value.select,
    name: value.name,
    rarity: 'common',
    source: group2tier(value.group, true),
    ...value.meta,
  };
}

// Look up and store the various translations of known string values
// eg: { name: 'Foo', 'en': { name: 'Foo' }, 'fr': { name: 'Le Foo' } }
function prepareTranslations(object, keys, languages) {
  for (let language of languages) {
    if (!object.hasOwnProperty(language)) {
      object[language] = {};
    }
    for (let key of keys) {
      let translation = translate(object[key], language);
      object[language][key] = translation;
    }
  }
}

function group2tier(group, flatten) {
  group = group.replace(/_\{(.*)\}/g, '$1');
  // console.log("Group:", group);

  switch (group) {
    case "Core Rulebook":
    case "Player Core":
      return flatten ? "core" : "core1";

    case "Advanced Player's Guide":
    case "Player Core 2":
      return flatten ? "core" : "core2";

    case "Secrets of Magic":
    case "Guns and Gears":
    case "Book of the Dead":
    case "Dark Archive":
    case "Rage of Elements":
    case "Gamemastery Guide":
    case "GM Core":
      return flatten ? "core" : "rulebooks";

    case "Lost Omens Ancestry Guide":
    case "Lost Omens Character Guide":
    case "Lost Omens World Guide":
    case "Lost Omens Travel Guide":
    case "Lost Omens Legends":
    case "Lost Omens Firebrands":
    case "Lost Omens Gods and Magic":
    case "Lost Omens Gods & Magic":
    case "Lost Omens Knights of Lastwall":
    case "Lost Omens Pathfinder Society Guide":
    case "Absalom, City of Lost Omens":
    case "Lost Omens Grand Bazaar":
    case "Lost Omens Mwangi Expanse":
      return "expansions"

    case "Pathfinder Beginner Box":
    case "Kingmaker":
    case "Age of Ashes":
    case "Extinction Curse":
    case "Agents of Edgewatch":
    case "Little Trouble in Big Absalom":
    case "Pathfinder Society":
    case "Strength of Thousands":
    case "Fists of the Ruby Phoenix":
    case "Blood Lords":
    case "Abomination Vaults":
    case "Quest for the Frozen Flame":
    case "Gatewalkers":
    case "Crown of the Kobold King":
    case "Outlaws of Alkenstar":
    case "Stolen Fate":
    case "The Fall of Plaguestone":
      return "adventures";

    default:
      return "thirdparty";
  }
}
