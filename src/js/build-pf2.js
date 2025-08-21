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
      game: edition,
      isLoggedIn: isLoggedIn(),
      edition: edition,
      language: document.getElementById("body").dataset.language,
      classes: []
    }
  };

  function getInputValue(id) {
    let input = document.getElementById(id);
    if (input === undefined || input === null) {
      return null;
    }
    return input.value;
  }

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
      if ('clsSelects' in dataset) {
        for (let sel of dataset.clsSelects.split(',')) {
          let selectkey = toCamelCase(sel.replaceAll('/', '-'));
          character.attributes[sel] = dataset[selectkey];
        }
      }

      character.attributes.multiclass = readMultiselect("multiclass");
      // TODO sub-multiclass
      character.attributes.archetypes = readMultiselect("archetype");
      // TODO sub-archetype
      
      character.attributes.feats = [];
      if (readBoolean("featDiehard")) {
        character.attributes.feats.push("diehard");
      }

      character.attributes.optionCover = readBoolean("pageCover");
      character.attributes.optionReference = readBoolean("pageReference"),
      character.attributes.optionActions = readBoolean("pageActions");
      character.attributes.optionBuild = readBoolean("pageBuild"),
      character.attributes.optionMinis = readBoolean("pageMinis");
      character.attributes.miniSize = dataset["pageSizeMini"];

      character.attributes.optionCharacterBackground = readBoolean("pageCharacterBackground");
      character.attributes.optionLevelUp = readBoolean("pageLevelUp");
      // character.attributes.optionPfs: false,

      character.attributes.inventoryStyle = dataset["pageInventory"];
      character.attributes.optionInventoryExtra = readBoolean("pageInventoryExtra");
      character.attributes.optionAnimalCompanion = readBoolean("pageAnimalCompanion");
      character.attributes.optionFamiliar = readBoolean("pageFamiliar");
      character.attributes.optionConstruct = readBoolean("pageConstruct");

      character.attributes.optionFreeArchetype = readBoolean("optionFreeArchetype");
      character.attributes.optionAncestryParagon = readBoolean("ancestryParagon");
      character.attributes.optionAutomaticBonusProgression = readBoolean("automaticBonusProgression");
      character.attributes.optionAutomaticWeaponProgression = readBoolean("automaticWeaponProgression");
      character.attributes.optionProficiencyWithoutLevel = readBoolean("proficiencyWithoutLevel");
      break;

    case 'gm':
      character.attributes.gm = dataset["gm"];

      switch (character.attributes.gm) {
        case 'characters':
          character.attributes.optionGmParty = readBoolean("pageGmParty");
          character.attributes.optionGmNpcParty = readBoolean("pageGmNpcGroup");
          character.attributes.optionGmNpc = readBoolean("pageGmNpc");
          break;

        case 'maps':
          character.attributes.mapView = dataset["pageGmMaps"];
          break;
      }
      break;

    case 'kingmaker':
      break;

    case 'mini':
      break;

    default:
      return null;
  }
  
  // common fields
  character.attributes.optionPermission = readBoolean("pagePermission");

  // appearance
  switch (dataset.pageBackground) {
    case 'magnolia':
      character.attributes.printBackground = 'magnolia';
      break;
    case 'parchment':
      character.attributes.printBackground = 'backgrounds/paper3.jpg';
      break;
    case 'frost':
      character.attributes.printBackground = 'backgrounds/frost1.jpg';
      break;
  }

  character.attributes.printColour = dataset.baseColour;
  character.attributes.accentColour = dataset.accentColour;
  character.attributes.printBrightness = dataset.printBrightness;
  character.attributes.printWatermark = dataset.watermark;

  // accessibility
  character.attributes.printHighContrast = readBoolean("highContrast");
  character.attributes.printLarge = readBoolean("largePrint");
  character.attributes.optionColourful = readBoolean("colourful");
  character.attributes.printDyslexic = readBoolean("dyslexic");
  if (character.attributes.printDyslexic) {
    character.attributes.printDyslexicFont = dataset.dyslexicFont;
  }

  // images
  switch (type) {
    // Character pages
    case 'character':
      mapImage('printPortrait', getInputValue('data-image-character-portrait'));
      mapImage('printLogo', getInputValue('data-image-character-logo'));
      mapImage('printAnimal', getInputValue('data-image-character-animal'));
      break;

    case 'gm':
      break;

    case 'kingmaker':
      break;

    case 'mini':
      mapImage('printPortrait', getInputValue('data-image-mini-portrait'));
      break;

    default:
      return null;
  }

  // make the full request object
  var request = {
    "version": 0,
    "data": character,
    "included": attachments
  };

  return request;
}
