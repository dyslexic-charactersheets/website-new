let pf2logger = getDebug('build-pf2');

function readPf2FormAndSubmit(type) {
  pf2logger.log("Download");
  
  let request = readPf2Form(type);
  if (isLoggedIn()) {
    saveCharacter(request);
  }
  downloadCharacterSheet(request);
}

function readPf2Form(type) {
  var form = document.getElementById("build-form");

  let dataset = form.dataset;
  var edition = dataset.edition;
  var id = generateId();

  var character = {
    type,
    id,
    attributes: {
      game: 'pathfinder2',
      edition: edition,
      language: document.getElementById("body").dataset.language,
      classes: []
    }
  };

  function readMultiselect(code) {
    let values = [];
    for (let i = 0; i <= dataset[`${code}Num`]; i++) {
      let index = `${code}_${i}`;
      if (dataset.hasOwnProperty(index)) {
        let value = dataset[index];
        if (value !== undefined && value !== null && value != "") {
          values.push(value);
        }
      }
    }
    return values;
  }

  function readBoolean(code) {
    let value = dataset[code];
    return value == "true";
  }

  // attach images
  let attachments = [];
  function mapImage(name, value) {
    if (value === undefined || value === null || value == "") {
      return;
    }
    
    if (value.startsWith("data:")) {
      imageId = generateId();
      
      attachments.push({
        type: "image",
        id: imageId,
        data: value
      });

      character.attributes[name] = {
        type: "image",
        id: imageId
      };
    } else {
      character.attributes[name] = value;
    }
  }

  switch (type) {
    // Character pages
    case 'character':
      // basic properties
      character.attributes.ancestry = dataset.ancestry;
      character.attributes.heritage = dataset.heritage;
      character.attributes.background = dataset.background;
      character.attributes['class'] = dataset.cls;

      // subclass and/or feats
      for (let sel of dataset.clsSelects.split(',')) {
        let selectkey = toCamelCase(sel.replaceAll('/', '-'));
        character.attributes[sel] = dataset[selectkey];
      }

      character.attributes.multiclass = readMultiselect("multiclass");
      // TODO sub-multiclass
      character.attributes.archetypes = readMultiselect("archetype");
      // TODO sub-archetype
      
      // character.optionCover = 
      character.attributes.feats = [];
      if (readBoolean("featDiehard")) {
        character.attributes.feats.push("diehard");
      }

      // character.attributes.optionPermission: true,
      // character.attributes.optionCover = readBoolean(""),
      // character.attributes.optionReference": true,
      // character.attributes.optionBuild": true,
      // character.attributes.optionMinis": true,
      // character.attributes.optionBackground: true,
      // character.attributes.optionLevelUp: true,
      // character.attributes.optionColourful: true,
      // character.attributes.optionPfs: false,
      character.attributes.optionFreeArchetype = readBoolean("optionFreeArchetype");
      character.attributes.optionAncestryParagon = readBoolean("ancestry-paragon");
      character.attributes.optionAutomaticBonusProgression = readBoolean("automaticBonusProgression");
      character.attributes.optionAutomaticWeaponProgression = readBoolean("automaticWeaponProgression");
      character.attributes.optionProficiencyWithoutLevel = readBoolean("proficiencyWithoutLevel");
      break;
  }

  // make the full request object
  var request = {
    "version": 0,
    "data": character,
    "included": attachments
  };

  return request;
}
