import dyslexicCharacterSheets from 'dyslexic-charactersheets';
import { has, slugify, log, warn, error } from './util.js';
import { translate } from './i18n.js';


export function loadGame(game) {
  return new Promise((resolve, reject) => {
    dyslexicCharacterSheets.getFormData(game).then((data) => {
      // get fixed selects
      let gamedata = extractSelects(data, [
        "ancestry",
        "background",
        "class",
        "archetype",
      ]);
      
      // separate out multiclass archetypes
      if (gamedata.archetype) {
        let [multiclassValues, archetypeValues] = splitValues(gamedata.archetype.values, (item) => item.multiclass);
        gamedata.multiclass = {
          select: "multiclass",
          name: "_{Multiclass}",
          max: 3,
          base: false,
          values: multiclassValues
        }
        gamedata.archetype = {
          ...gamedata.archetype,
          values: archetypeValues
        }
      }

      // get variable selects
      let heritages = getSubSelects(gamedata.ancestry, "ancestry");
      let subclasses = getSubSelects(gamedata['class'], "class");
      let submulticlasses = getSubSelects(gamedata.multiclass, "multiclass")
      let subarchetypes = getSubSelects(gamedata.archetype, "archetype");

      let gamedata2 = extractSelects(data, [
        ...heritages,
        "heritage/versatile",
        ...subclasses,
        ...submulticlasses,
        ...subarchetypes,
      ]);

      // apply versatile heritages
      if (game == "pathfinder2") {
        // TODO
      }

      // put them together
      gamedata = {...gamedata, ...gamedata2};

      // prepare all selects for searching
      for (let select of gamedata) {
        // TODO
      }

      // prepare translations
      let strings = new Set();
      for (let select of gamedata) {
        prepareTranslations(select, ['name']);
        strings.add(select.name);
        for (let value of values) {
          prepareTranslations(value, ['group', 'name']);
        }
      }

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
      select.displayGroups = groupSelectValues(select.values, select.groups, select.select);
      outdata[select.select] = select;
    }
  }

  return outdata;
}

function groupSelectValues(values, groups, name) {
  let valuesById = {};
  for (let value of values) {
    valuesById[value.id] = value;
    valuesById[value.code] = value;
    let slugId = slugify(value.id);
    valuesById[slugId] = value;
    let shortId = value.id.replace(/^.*\//, '');
    valuesById[shortId] = value;
  }

  // embed values into groups
  for (let groupName in groups) {
    groups[groupName].groupValues = [];
    if (!has(groups, groupName)) {
      error("gamedata-lib", "Group not found".red, groupName);
    }
    for (let value of groups[groupName]) {
      if (!has(valuesById, value)) {
        error("gamedata-lib", "Value not found".red, value);
      } else if (valuesById[value] === undefined) {
        error("gamedata-lib", "Value is undefined".red, value);
      } else if (valuesById[value] === null) {
        error("gamedata-lib", "Value is null".red, value);
      }
      groups[groupName].groupValues.push(valuesById[value]);
    }
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
  for (let groupName in groups) {
    let tier = group2tier(groupName);
    tiers[tier].push({
      group: groupName,
      values: groups[groupName].groupValues,
    });
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

// Look up and store the various translations of known string values
// eg: { name: 'Foo', 'en': { name: 'Foo' }, 'fr': { name: 'Le Foo' } }
function prepareTranslations(object, keys, languages) {
  for (let language of languages) {
    object[language] = {};
    for (let key of keys) {
      let translation = translate(object[key], language);
      object[language][key] = translation;
    }
  }
  for (let key of keys) {
    object[key] = translate(object[key], 'en');
  }
}

function group2tier(group) {
  group = group.replace(/_\{(.*)\}/g, '$1');
  // console.log("Group:", group);

  switch (group) {
    case "Core Rulebook":
    case "Player Core":
      return "core1";

    case "Advanced Player's Guide":
    case "Player Core 2":
      return "core2";

    case "Secrets of Magic":
    case "Guns and Gears":
    case "Book of the Dead":
    case "Dark Archive":
    case "Rage of Elements":
    case "Gamemastery Guide":
    case "GM Core":
      return "rulebooks";

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
