/**
 * Copyright 2025 Marcus Downing
 * Licensed under the Artistic License 2.0
 */

let pf2logger = getDebug('build-pf2');

function readPf2FormAndSubmit(type) {
  pf2logger.log("Download");
  set('body', 'downloadStatus', 'in-progress');
  set('body', 'currentMenu', 'download-menu');
  
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
  if (edition === undefined || edition === null || edition == "") {
    edition = "pathfinder2";
  }

  var id = generateId();

  var character = {
    type,
    id,
    attributes: {
      game: edition,
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

  function readRadio(name) {
    let value = false;
    for (let radio of document.getElementsByName(name)) {
      if (radio.checked) {
        value = radio.value;
      }
    }
    return value;
  }

  function readColour(colour, custom) {
    if (colour == 'custom') {
      return custom;
    }
    return colour;
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
      character.attributes.classes.push(dataset.cls);

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
      
      character.attributes.downloadPDF = dataset["characterDownloadFormat"] == "pdf";
      character.attributes.downloadPaperSize = dataset["characterDownloadPaper"];
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
      
      character.attributes.downloadPDF = readRadio("gmDownloadFormat") == "pdf";
      character.attributes.downloadPaperSize = readRadio("gmDownloadPaper");
      break;

    case 'starship':
      
      character.attributes.downloadPDF = readRadio("starshipDownloadFormat") == "pdf";
      character.attributes.downloadPaperSize = readRadio("starshipDownloadPaper");
      break;

    case 'kingmaker':
      
      character.attributes.downloadPDF = readRadio("kingmakerDownloadFormat") == "pdf";
      character.attributes.downloadPaperSize = readRadio("kingmakerDownloadPaper");
      break;

    case 'mini':
      
      character.attributes.downloadPDF = readRadio("miniDownloadFormat") == "pdf";
      character.attributes.downloadPaperSize = readRadio("miniDownloadPaper");
      break;

    default:
      return null;
  }
  
  // common fields
  character.attributes.optionPermission = readBoolean("pagePermission");
  // character.attributes.downloadPDF = readRadio("downloadFormat") == "pdf";
  // character.attributes.downloadPaperSize = readRadio("downloadPaper");

  // appearance
  switch (dataset.pageBackground) {
    case 'magnolia':
    case 'lilac':
      character.attributes.printBackground = dataset.pageBackground;
      break;
    case 'parchment':
      character.attributes.printBackground = 'backgrounds/paper3.jpg';
      break;
    case 'frost':
      character.attributes.printBackground = 'backgrounds/frost1.jpg';
      break;
  }

  character.attributes.printColour = readColour(dataset.baseColour, dataset.baseColourCustom);
  character.attributes.accentColour = readColour(dataset.accentColour, dataset.accentColourCustom);
  character.attributes.printIntensity = -dataset.printBrightness;
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
